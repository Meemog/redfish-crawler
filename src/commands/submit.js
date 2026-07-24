const { parseArgs } = require("../args/submit");
const { submit } = require("../methods/submitter");

async function submitCommand(argv) {
  const args = parseArgs(argv);
  await submit(args.api, args.file);
}

module.exports = {
  submitCommand,
};
