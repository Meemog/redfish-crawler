require("dotenv").config();
const fs = require("fs");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const hostname = process.env.HOSTNAME || "https://ratbat.bmc";
const username = process.env.USERNAME;
const password = process.env.PASSWORD;

const MAX_DEPTH = 5;

const visitedUrls = new Set();

const SKIP_KEYS = new Set([
  "Actions",
  "Oem",
  "Links",
  "LogServices",
  "EventService",
  "SessionService",
  "CertificateService",
  "UpdateService",
  "TelemetryService",
  "MetricReports",
  "Registries",
]);

const SKIP_PATHS = [
  "/Managers/",
  "/TaskService/",
  "/Sessions/",
  "/EventService/",
  "/UpdateService/",
  "/CertificateService/",
];

function shouldFollow(path) {
  return !SKIP_PATHS.some((skip) => path.includes(skip));
}

async function fetchRedfish(path) {
  const url = `${hostname}${path}`;

  if (visitedUrls.has(url)) {
    return null;
  }

  visitedUrls.add(url);

  console.log("Fetching:", url);

  const response = await fetch(url, {
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
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

async function crawl(path, depth = 0) {
  if (depth > MAX_DEPTH) {
    return null;
  }

  if (!shouldFollow(path)) {
    return null;
  }

  const data = await fetchRedfish(path);

  if (!data) {
    return null;
  }

  return await parseData(data, depth);
}

async function parseData(data, depth, key = "") {
  const type = getType(data, key);

  if (
    type === "object" &&
    data["@odata.id"] &&
    Object.keys(data).length === 1
  ) {
    if (depth >= MAX_DEPTH) {
      return data["@odata.id"];
    }

    return await crawl(data["@odata.id"], depth + 1);
  }

  if (type === "array") {
    const result = [];

    for (const item of data) {
      result.push(await parseData(item, depth, ""));
    }

    return result;
  }

  if (type === "object") {
    const result = {};

    for (const key of Object.keys(data)) {
      if (SKIP_KEYS.has(key)) {
        continue;
      }

      if (key.endsWith("@odata.count")) {
        continue;
      }

      result[key] = await parseData(data[key], depth, key);
    }

    return result;
  }

  if (type === "url") {
    if (depth >= MAX_DEPTH) {
      return data;
    }

    return await crawl(data, depth + 1);
  }

  return data;
}

async function main() {
  // Pass any Redfish asset path here
  const assetPath = "/redfish/v1/Systems/System.Embedded.1";

  const asset = await crawl(assetPath);

  fs.writeFileSync(
    "redfish_asset.json",
    JSON.stringify(asset, null, 2),
    "utf8",
  );

  console.log("Saved redfish_asset.json");

  console.log("Resources crawled:", visitedUrls.size);
}

main().catch(console.error);
