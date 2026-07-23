const fs = require("fs/promises");

const flatDict = {};

function getType(value) {
  if (Array.isArray(value)) return "array";
  if (value !== null && typeof value === "object") return "dictionary";

  return typeof value;
}

function flatten(path, data) {
  const type = getType(data);

  if (type === "array") {
    for (let i = 0; i < data.length; i++) {
      flatten(`${path}[${i}]`, data[i]);
    }
  } else if (type === "dictionary") {
    for (const key of Object.keys(data)) {
      flatten(`${path}/${key}`, data[key]);
    }
  } else {
    if (data !== null) {
      flatDict[path] = data;
    }
  }
}

async function main() {
  const json = await fs.readFile("redfish_asset.json", "utf8");
  const data = JSON.parse(json);

  flatten("", data);

  await fs.writeFile("redfish_flat.json", JSON.stringify(flatDict, null, 2));

  console.log("Saved redfish_flat.json");
}

main();
