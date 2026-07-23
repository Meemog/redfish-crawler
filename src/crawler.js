const fs = require("fs");
const { SKIP_KEYS, shouldFollow } = require("./constants");

const visitedUrls = new Set();

function createLimiter(limit) {
  let active = 0;
  const queue = [];

  async function run(fn) {
    if (active >= limit) {
      await new Promise((resolve) => queue.push(resolve));
    }

    active += 1;

    try {
      return await fn();
    } finally {
      active -= 1;

      const next = queue.shift();
      if (next) {
        next();
      }
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

async function fetchRedfish(hostname, username, password, path, timeout) {
  const url = new URL(path, hostname).toString();

  if (visitedUrls.has(url)) {
    return null;
  }

  visitedUrls.add(url);

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    console.log("Fetching:", url);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: buildAuthHeader(username, password),
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.log("HTTP", response.status, url);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      console.log("Skipping non-json:", url);
      return null;
    }

    return await response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Timeout:", url);
    } else {
      console.log("Fetch error:", url, err.message);
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

async function crawl(options, path, depth = 0, limit) {
  if (depth > options.maxDepth) {
    return null;
  }

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
    ),
  );

  if (!data) {
    return null;
  }

  return parseData(
    data,
    (childPath, nextDepth = depth + 1) =>
      crawl(options, childPath, nextDepth, limit),
    depth,
  );
}

async function crawlRedfish(options) {
  visitedUrls.clear();

  const limit = createLimiter(options.concurrency);

  const asset = await crawl(options, options.assetPath, 0, limit);

  return {
    asset,
    visitedCount: visitedUrls.size,
  };
}

function writeOutput(filePath, asset) {
  fs.writeFileSync(filePath, JSON.stringify(asset, null, 2), "utf8");
}

module.exports = {
  crawlRedfish,
  writeOutput,
};
