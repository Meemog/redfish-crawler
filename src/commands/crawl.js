const { parseArgs, printUsage } = require("../args/crawl");
const { crawlRedfish, writeOutput } = require("../methods/crawler");
const { confirm, password } = require("@inquirer/prompts");
const ora = require("ora");

async function passwordPrompt() {
  return await password({
    message: "Redfish password (Skip by setting REDFISH_PASSWORD in .env):",
    mask: "*",
  });
}

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

async function crawl(argv, commandName) {
  const options = parseArgs(argv, commandName);

  if (!options.password) {
    options.password = await passwordPrompt();
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

  if (options.insecure) {
    const answer = await confirm({
      message:
        "Warning: Insecure TLS is enabled. This may expose you to security risks. Do you want to continue?",
    });

    if (!answer) {
      console.log("Aborting due to insecure TLS.");
      process.exit(1);
    }
  }

  let asset, stats;

  const spinner = options.verbose ? null : ora("Crawling").start();

  try {
    ({ asset, stats } = await crawlRedfish(options));

    spinner?.succeed("Complete!");
  } catch (err) {
    spinner?.fail("Failed");
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  writeOutput(options.outputFile, asset);

  console.log("\nCrawl summary");
  console.log("-------------");
  console.log(`Output file       : ${options.outputFile}`);
  console.log(`Resources visited : ${stats.visitedCount}`);
  console.log(`Successful fetches: ${stats.fetched}`);
  console.log(`Failed fetches    : ${stats.failed}`);
  console.log(`Skipped           : ${stats.skipped}`);
  console.log(`Max concurrency   : ${stats.maxConcurrent}`);
  console.log(`Max depth         : ${stats.maxDepthReached}`);
  console.log(`Duration          : ${formatDuration(stats.duration)}`);
}

module.exports = {
  crawl,
};
