const { parseArgs, printUsage } = require("./args");
const { crawlRedfish, writeOutput } = require("./crawler");

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

  const { asset, visitedCount } = await crawlRedfish(options);
  writeOutput(options.outputFile, asset);

  console.log(`Saved ${options.outputFile}`);
  console.log(`Resources crawled: ${visitedCount}`);
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
