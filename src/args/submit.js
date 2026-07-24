const { normalizeHostname } = require("./args");

const DEFAULTS = {
  api: process.env.REDFISH_API_PATH,
  file: null,
};

function validateOptions(options) {
  const errors = [];

  if (!options.file) {
    errors.push("Missing file path. Provide <FILE> to submit.");
  }

  if (!options.api) {
    errors.push(
      "Missing API path. Provide --api API_PATH or set REDFISH_API_PATH in .env",
    );
  }

  if (errors.length > 0) {
    throw new Error(
      [
        "Invalid configuration:",
        "",
        ...errors.map((error) => `  - ${error}`),
        "",
        "Use --help for usage information.",
      ].join("\n"),
    );
  }

  return options;
}

function parseArgs(argv) {
  if (argv.length === 0) {
    throw new Error(
      "Missing arguments. Usage: redfish-crawler submit <FILE> [--api API_PATH] or set REDFISH_API_PATH in .env",
    );
  }

  const options = { ...DEFAULTS };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case "-h":
      case "--help":
        printUsage();
        process.exit(0);
      case "--api":
        options.api = normalizeHostname(argv[++i]);
        if (!options.api) {
          throw new Error("Missing value for --api option.");
        }
        continue;
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown option: ${arg}`);
        }
    }

    if (!options.file) {
      options.file = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return validateOptions(options);
}

function printUsage() {
  console.log("Usage: redfish-crawler submit <FILE> [--api API]");
  console.log("");
  console.log("Options:");
  console.log(
    "  --api API           Set the API endpoint (or set REDFISH_API_PATH in .env)",
  );
  console.log("  -h, --help          Show this help message");
}

module.exports = {
  parseArgs,
};
