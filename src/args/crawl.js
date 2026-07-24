const { normalizeHostname, normalizePath } = require("./args");
const DEFAULTS = {
  hostname: process.env.REDFISH_HOSTNAME,
  username: process.env.REDFISH_USERNAME,
  password: process.env.REDFISH_PASSWORD,
  assetPath: process.env.REDFISH_ASSET_PATH,
  maxDepth: Number(process.env.REDFISH_DEPTH ?? 5),
  outputFile: process.env.REDFISH_OUTPUT ?? "redfish_asset.json",
  insecure: process.env.REDFISH_INSECURE === "true",
  timeout: Number(process.env.REDFISH_TIMEOUT ?? 10000),
  concurrency: Number(process.env.REDFISH_CONCURRENCY ?? 5),
  verbose: process.env.REDFISH_VERBOSE === "true",
};

function validateOptions(options) {
  const errors = [];

  if (!options.hostname) {
    errors.push(
      "Missing hostname. Provide --hostname URL or set REDFISH_HOSTNAME in .env. (e.g., https://example.bmc)",
    );
  } else {
    try {
      new URL(options.hostname);
    } catch {
      errors.push(`Invalid hostname URL: ${options.hostname}`);
    }
  }

  if (!options.assetPath) {
    errors.push(
      "Missing asset path. Provide --asset-path PATH or set REDFISH_ASSET_PATH in .env. (e.g., /redfish/v1/Systems/1)",
    );
  }

  if (!options.username) {
    errors.push(
      "Missing username. Provide --username USER or set REDFISH_USERNAME in .env.",
    );
  }

  if (!options.outputFile) {
    errors.push(
      "Missing output file. Provide --output FILE or set REDFISH_OUTPUT in .env.",
    );
  }

  if (!Number.isInteger(options.maxDepth) || options.maxDepth < 0) {
    errors.push(
      `Invalid depth value: ${options.maxDepth}. Must be a non-negative integer.`,
    );
  }

  if (!Number.isInteger(options.timeout) || options.timeout < 0) {
    errors.push(
      `Invalid timeout value: ${options.timeout}. Must be a non-negative integer.`,
    );
  }

  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    errors.push(
      `Invalid concurrency value: ${options.concurrency}. Must be a positive integer.`,
    );
  }

  if (typeof options.insecure !== "boolean") {
    errors.push("Invalid insecure option. Must be true or false.");
  }

  if (typeof options.verbose !== "boolean") {
    errors.push("Invalid verbose option. Must be true or false.");
  }

  if (errors.length > 0) {
    console.log(
      [
        "Invalid configuration:",
        "",
        ...errors.map((error) => `  - ${error}`),
        "",
        "Use --help for usage information.",
      ].join("\n"),
    );
    process.exit(1);
  }

  return options;
}

function printUsage() {
  console.log("Usage: redfish-crawler crawl [options]");
  console.log("");
  console.log("Options:");
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
  console.log("  -h, --help          Show this help message");
}

function parseArgs(argv) {
  const options = { ...DEFAULTS };
  let sawPath = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case "-h":
      case "--help":
        printUsage();
        process.exit(0);
      case "--hostname":
        options.hostname = normalizeHostname(argv[++i]);
        break;
      case "--username":
        options.username = argv[++i];
        break;
      case "--output":
        options.outputFile = argv[++i];
        break;
      case "--asset-path":
        options.assetPath = normalizePath(argv[++i]);
        break;
      case "--concurrency": {
        options.concurrency = parseInt(argv[++i], 10);
        break;
      }
      case "--depth": {
        options.maxDepth = parseInt(argv[++i], 10);
        break;
      }
      case "--timeout": {
        options.timeout = parseInt(argv[++i], 10);
        break;
      }
      case "--insecure":
        options.insecure = true;
        break;
      case "--verbose":
        options.verbose = true;
        break;
      default:
        if (arg.startsWith("--")) {
          console.log(`Unknown option: ${arg}`);
          process.exit(1);
        }

        if (!sawPath) {
          options.assetPath = normalizePath(arg);
          sawPath = true;
        } else {
          console.log(`Unexpected argument: ${arg}`);
          process.exit(1);
        }
    }
  }

  return validateOptions(options);
}

module.exports = {
  parseArgs,
  printUsage,
};
