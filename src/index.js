require("dotenv").config();

const { detectCommand, printUsage } = require("./args/args");
const { crawl } = require("./commands/crawl");
const { submitCommand } = require("./commands/submit");

async function main(argv, commandName) {
  const command = detectCommand(argv);

  try {
    if (command === "submit") {
      await submitCommand(argv.slice(1), commandName);
    } else if (command === "crawl") {
      await crawl(argv.slice(1), commandName);
    } else {
      printUsage(commandName);
      process.exit(1);
    }
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv.slice(2), process.argv[1].split("/").pop()).catch(
    (error) => {
      console.error(error.message || error);
      process.exit(1);
    },
  );
}

module.exports = {
  main,
};
