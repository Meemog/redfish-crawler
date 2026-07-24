function detectCommand(argv) {
  if (argv.length === 0) {
    return "help";
  }

  const firstArg = argv[0];

  if (firstArg === "submit") {
    return "submit";
  }

  if (firstArg === "crawl") {
    return "crawl";
  }

  if (firstArg === "-h" || firstArg === "--help") {
    return "help";
  }

  return "invalid";
}

function normalizeHostname(hostname) {
  if (!hostname) {
    return hostname;
  }

  return hostname.replace(/\/+$/, "");
}

function normalizePath(path) {
  if (!path) {
    return path;
  }

  return `/${path.replace(/^\/+/, "")}`;
}

function printUsage() {
  console.log("Usage: redfish-crawler <command> [options]");
  console.log("");
  console.log("Commands:");
  console.log("  crawl               Crawl Redfish endpoint (default)");
  console.log(
    "  submit <FILE> [--api API] Submit crawled data to API endpoint (or set REDFISH_API_PATH in .env)",
  );
  console.log("");
  console.log("Crawl Options:");
  console.log(
    "  --hostname URL      Set the Redfish hostname (e.g., https://example.bmc)",
  );
  console.log(
    "  --asset-path PATH   Set the Redfish asset path (e.g., /redfish/v1/Systems/1)",
  );
  console.log("  --username USER     Set the username to use for Basic auth");
  console.log(
    "  --output FILE       Write asset JSON to FILE (default redfish_asset.json)",
  );
  console.log("  --depth N           Set maximum crawl depth (default 5)");
  console.log(
    "  --timeout N         Set request timeout in ms (default 10000)",
  );
  console.log(
    "  --concurrency N     Set maximum number of concurrent requests (default 5)",
  );
  console.log("  --insecure          Disable TLS certificate verification");
  console.log("  --verbose           Enable verbose output");
  console.log("\n");
  console.log("  -h, --help          Show this help message");
}

module.exports = {
  detectCommand,
  printUsage,
  normalizeHostname,
  normalizePath,
};
