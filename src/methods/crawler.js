const fs = require("fs");
const { SKIP_KEYS, shouldFollow } = require("./constants");
const { Agent } = require("undici");

const visitedUrls = new Set();

function isTlsError(err) {
  const tlsCodes = new Set([
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "SELF_SIGNED_CERT_IN_CHAIN",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "CERT_HAS_EXPIRED",
    "ERR_TLS_CERT_ALTNAME_INVALID",
  ]);

  return tlsCodes.has(err.code) || tlsCodes.has(err.cause?.code);
}

function createDispatcher(insecure) {
  return new Agent({
    connect: {
      rejectUnauthorized: !insecure,
    },
  });
}

function createLimiter(limit, stats) {
  let active = 0;
  const queue = [];

  async function acquire() {
    while (active >= limit) {
      await new Promise((resolve) => queue.push(resolve));
    }
    active++;
  }

  function release() {
    active--;
    queue.shift()?.();
  }

  async function run(fn) {
    await acquire();

    stats.activeRequests = active;
    stats.maxConcurrent = Math.max(stats.maxConcurrent, active);

    try {
      return await fn();
    } finally {
      release();
    }
  }

  return run;
}

function buildAuthHeader(username, password) {
  if (!username || !password) {
    return null;
  }

  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

async function fetchRedfish(
  hostname,
  username,
  password,
  path,
  timeout,
  stats,
  verbose,
  insecure,
  dispatch,
  spinner,
) {
  const url = new URL(path, hostname).toString();

  if (visitedUrls.has(url)) {
    stats.skipped += 1;
    return null;
  }

  visitedUrls.add(url);

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    if (verbose) {
      console.log("Fetching:", url);
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: buildAuthHeader(username, password),
        Accept: "application/json",
      },
      dispatcher: dispatch,
    });

    if (!response.ok) {
      if (stats.failed == 0) {
        if (spinner) {
          spinner.fail("Entrypoint URL fetch failed");
        } else {
          console.log("Entrypoint URL fetch failed, exiting...");
        }
        console.log("HTTP", response.status, url);
        process.exit(1);
      }
      stats.httpErrors += 1;
      stats.failed += 1;

      if (verbose) {
        console.log("HTTP", response.status, url);
      }
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      if (verbose) {
        console.log("Skipping non-json:", url);
      }
      stats.skipped += 1;
      return null;
    }

    const data = await response.json();

    stats.fetched += 1;

    return data;
  } catch (err) {
    stats.failed += 1;

    if (isTlsError(err)) {
      spinner?.fail("TLS error");
      console.log(
        `TLS certificate validation failed for ${url}. ` +
          `\nTry again with the --insecure option if you trust this device.`,
      );
      process.exit(1);
    }

    if (err.name === "AbortError") {
      if (verbose) {
        console.log("Timeout:", url);
      }
      stats.timedOut += 1;
    } else {
      if (verbose) {
        console.log("Fetch error:", url, err.message);
      }
    }

    return {
      "@odata.id": path,
      _error: "timeout",
    };
  } finally {
    clearTimeout(timer);
  }
}

function getType(value, key = "") {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value !== null && typeof value === "object") {
    return "object";
  }

  if (
    key === "@odata.id" &&
    typeof value === "string" &&
    value.startsWith("/redfish/v1/")
  ) {
    return "url";
  }

  return "value";
}

async function parseData(data, crawl, depth, key = "") {
  const type = getType(data, key);

  if (
    type === "object" &&
    data["@odata.id"] &&
    Object.keys(data).length === 1
  ) {
    if (depth >= crawl.maxDepth) {
      return data["@odata.id"];
    }
    return crawl(data["@odata.id"], depth + 1);
  }

  if (type === "array") {
    return Promise.all(data.map((item) => parseData(item, crawl, depth, "")));
  }

  if (type === "object") {
    const result = {};

    for (const key of Object.keys(data)) {
      if (SKIP_KEYS.has(key) || key.endsWith("@odata.count")) {
        continue;
      }

      const value = await parseData(data[key], crawl, depth, key);

      if (value !== null && value !== undefined) {
        result[key] = value;
      }
    }

    return result;
  }

  if (type === "url") {
    if (depth >= crawl.maxDepth) {
      return data;
    }
    return crawl(data, depth + 1);
  }

  return data;
}

async function crawl(
  options,
  path,
  depth = 0,
  limit,
  stats,
  dispatch,
  spinner,
) {
  if (depth > options.maxDepth) {
    return null;
  }

  stats.resourcesDiscovered += 1;
  stats.maxDepthReached = Math.max(stats.maxDepthReached, depth);

  if (!shouldFollow(path)) {
    return null;
  }

  const data = await limit(() =>
    fetchRedfish(
      options.hostname,
      options.username,
      options.password,
      path,
      options.timeout,
      stats,
      options.verbose,
      options.insecure,
      dispatch,
      spinner,
    ),
  );

  if (!data) {
    return null;
  }

  return parseData(
    data,
    (childPath, nextDepth = depth + 1) =>
      crawl(options, childPath, nextDepth, limit, stats, dispatch),
    depth,
  );
}

async function crawlRedfish(options, spinner) {
  visitedUrls.clear();

  const stats = {
    fetched: 0,
    failed: 0,
    timedOut: 0,
    httpErrors: 0,
    skipped: 0,
    maxDepthReached: 0,
    activeRequests: 0,
    maxConcurrent: 0,
    resourcesDiscovered: 0,
    startTime: Date.now(),
  };

  const limit = createLimiter(options.concurrency, stats);

  const dispatch = createDispatcher(options.insecure);

  const asset = await crawl(
    options,
    options.assetPath,
    0,
    limit,
    stats,
    dispatch,
    spinner,
  );

  return {
    asset,
    stats: {
      ...stats,
      visitedCount: visitedUrls.size,
      duration: Date.now() - stats.startTime,
    },
  };
}

function writeOutput(filePath, asset) {
  fs.writeFileSync(filePath, JSON.stringify(asset, null, 2), "utf8");
}

module.exports = {
  crawlRedfish,
  writeOutput,
};
