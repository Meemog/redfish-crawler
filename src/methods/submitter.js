const fs = require("fs/promises");

function getByPath(obj, path) {
  return path.split(".").reduce((current, key) => {
    if (current == null) return undefined;

    const match = key.match(/^(.+)\[(\d+)\]$/);
    if (match) {
      return current[match[1]]?.[Number(match[2])];
    }

    return current[key];
  }, obj);
}

async function extractData(filePath) {
  const data = JSON.parse(await fs.readFile(filePath, "utf8"));

  const candidates = {
    name: [
      "Name",
      "Systems.1.Name",
      "Systems.0.Name",
      "System.Name",
      "ComputerSystem.Name",
    ],
    uuid: [
      "UUID",
      "Systems.1.UUID",
      "Systems.0.UUID",
      "System.UUID",
      "ComputerSystem.UUID",
    ],
  };

  const result = {};

  for (const [field, paths] of Object.entries(candidates)) {
    for (const path of paths) {
      const value = getByPath(data, path);
      if (value !== undefined) {
        result[field] = value;
        break;
      }
    }
  }

  return result;
}

async function submit(url, path) {
  console.log("Trying to fetch data from:", path);
  const data = await extractData(path);
  console.table(data);
}

module.exports = {
  submit,
};
