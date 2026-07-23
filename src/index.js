const { parseArgs, printUsage } = require("./args");
const { crawlRedfish, writeOutput } = require("./crawler");

function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms} ms`;
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)} s`;
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);

  return `${minutes} min ${seconds} s`;
}

async function main(argv) {
  const options = parseArgs(argv);

  if (!options.hostname) {
    printUsage();
    throw new Error("Missing hostname. Pass --hostname URL.");
  }

  if (!options.assetPath) {
    printUsage();
    throw new Error(
      "Missing asset path. Pass --asset-path PATH or provide assetPath as a positional argument.",
    );
  }

  if (!options.username || !options.password) {
    printUsage();
    throw new Error(
      "Missing username/password. Pass --username and --password.",
    );
  }

  if (options.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  console.log("Starting Redfish crawl with options:");
  console.log(`Hostname          : ${options.hostname}`);
  console.log(`Asset path        : ${options.assetPath}`);
  console.log(`Output file       : ${options.outputFile}`);
  console.log(`Max depth         : ${options.maxDepth}`);
  console.log(`Concurrency       : ${options.concurrency}`);
  console.log(`Timeout           : ${options.timeout} ms`);
  console.log(`Insecure TLS      : ${options.insecure ? "Yes" : "No"}`);
  console.log(`Verbose output    : ${options.verbose ? "Yes" : "No"}`);

  const { asset, stats } = await crawlRedfish(options);

  writeOutput(options.outputFile, asset);

  console.log("\nCrawl summary");
  console.log("-------------");
  console.log(`Output file       : ${options.outputFile}`);
  console.log(`Resources visited : ${stats.visitedCount}`);
  console.log(`Successful fetches: ${stats.fetched}`);
  console.log(`Failed fetches    : ${stats.failed}`);
  console.log(`Skipped           : ${stats.skipped}`);
  console.log(`Max concurrency   : ${stats.maxConcurrent}`);
  console.log(`Duration          : ${formatDuration(stats.duration)}`);
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  main,
};
