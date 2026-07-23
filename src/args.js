const DEFAULTS = {
  hostname: undefined,
  assetPath: undefined,
  maxDepth: 5,
  outputFile: "redfish_asset.json",
  insecure: false,
};

function printUsage() {
  console.log(
    "Usage: redfish-crawler --hostname URL --asset-path PATH [options]",
  );
  console.log("");
  console.log("Options:");
  console.log("  --hostname URL      Override the default hostname");
  console.log("  --username USER     Set the username to use for Basic auth");
  console.log("  --password PASS     Set the password to use for Basic auth");
  console.log("  --asset-path PATH   Override the default Redfish asset path");
  console.log(
    "  --output FILE       Write asset JSON to FILE (default redfish_asset.json)",
  );
  console.log("  --depth N           Set maximum crawl depth (default 5)");
  console.log("  --insecure          Disable TLS certificate verification");
  console.log("  -h, --help          Show this help message");
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

function validateOptions(options) {
  if (!options.hostname) {
    throw new Error("Missing required option: --hostname");
  }

  if (!options.assetPath) {
    throw new Error("Missing required option: --asset-path");
  }

  try {
    new URL(options.hostname);
  } catch {
    throw new Error(`Invalid hostname URL: ${options.hostname}`);
  }

  return options;
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
      case "--password":
        options.password = argv[++i];
        break;
      case "--output":
        options.outputFile = argv[++i];
        break;
      case "--asset-path":
        options.assetPath = normalizePath(argv[++i]);
        break;
      case "--depth": {
        const value = parseInt(argv[++i], 10);
        if (Number.isNaN(value) || value < 0) {
          throw new Error(`Invalid depth value: ${argv[i]}`);
        }
        options.maxDepth = value;
        break;
      }
      case "--insecure":
        options.insecure = true;
        break;
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown option: ${arg}`);
        }

        if (!sawPath) {
          options.assetPath = normalizePath(arg);
          sawPath = true;
        } else {
          throw new Error(`Unexpected argument: ${arg}`);
        }
    }
  }

  return validateOptions(options);
}

module.exports = {
  DEFAULTS,
  parseArgs,
  printUsage,
};
