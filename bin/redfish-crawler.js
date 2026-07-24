#!/usr/bin/env node

const { main } = require("../src/index");

main(process.argv.slice(2), process.argv[1].split("/").pop()).catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
