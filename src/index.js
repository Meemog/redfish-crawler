require("dotenv").config();

const { detectCommand, printUsage } = require("./args/args");
const { crawl } = require("./commands/crawl");
const { submitCommand } = require("./commands/submit");

async function main(argv) {
  const command = detectCommand(argv);

  try {
    if (command === "submit") {
      await submitCommand(argv.slice(1));
    } else if (command === "crawl") {
      await crawl(argv.slice(1));
    } else if (command === "help") {
      printUsage();
    } else {
      printUsage();
      process.exit(1);
    }
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
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
