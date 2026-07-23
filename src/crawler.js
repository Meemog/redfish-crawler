const fs = require("fs");
const { SKIP_KEYS, shouldFollow } = require("./constants");

const visitedUrls = new Set();

function buildAuthHeader(username, password) {
  if (!username || !password) {
    return null;
  }

  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

async function fetchRedfish(hostname, username, password, path) {
  const url = new URL(path, hostname).toString();

  if (visitedUrls.has(url)) {
    return null;
  }

  visitedUrls.add(url);
  console.log("Fetching:", url);

  const response = await fetch(url, {
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

  return response.json();
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
    const result = [];
    for (const item of data) {
      result.push(await parseData(item, crawl, depth, ""));
    }
    return result;
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

async function crawl(options, path, depth = 0) {
  if (depth > options.maxDepth) {
    return null;
  }

  if (!shouldFollow(path)) {
    return null;
  }

  const data = await fetchRedfish(
    options.hostname,
    options.username,
    options.password,
    path,
  );
  if (!data) {
    return null;
  }

  return parseData(
    data,
    (childPath, nextDepth = depth + 1) => crawl(options, childPath, nextDepth),
    depth,
    "",
  );
}

async function crawlRedfish(options) {
  visitedUrls.clear();
  const asset = await crawl(options, options.assetPath, 0);
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
