const { normalizeHostname } = require("./args");

const DEFAULTS = {
  api: process.env.REDFISH_API_PATH,
  file: null,
  uPosition: 0,
  notes: null,
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

  if (options.uPosition !== undefined) {
    const uPositionNum = Number(options.uPosition);
    if (isNaN(uPositionNum)) {
      errors.push(
        `Invalid U position: ${options.uPosition}. Must be a number.`,
      );
    } else {
      options.uPosition = uPositionNum;
    }
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

function parseArgs(argv) {
  if (argv.length === 0) {
    console.log(
      "Missing arguments. Usage: redfish-crawler submit <FILE> [--api API_PATH]",
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
        continue;

      case "--u-position":
        options.uPosition = argv[++i];
        continue;

      case "--notes":
        options.notes = argv[++i];
        continue;

      default:
        if (arg.startsWith("--")) {
          console.log(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }

    if (!options.file) {
      options.file = arg;
    } else {
      console.log(`Unexpected argument: ${arg}`);
      process.exit(1);
    }
  }

  return validateOptions(options);
}

function printUsage() {
  console.log(
    "Usage: redfish-crawler submit <FILE> [--api API] [--u-position POSITION] [--notes NOTES]",
  );
  console.log("");
  console.log("Options:");
  console.log(
    "  --api API                 Set the API endpoint (or set REDFISH_API_PATH in .env)",
  );
  console.log("  --u-position POSITION     Set U position");
  console.log("  --notes NOTES             Add submission notes");
  console.log("  -h, --help                Show this help message");
}

module.exports = {
  parseArgs,
};
