const fs = require("fs/promises");

async function getRacks(hostname) {
  const url = new URL("/api/racks", hostname).toString();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch racks from ${url}: ${response.statusText}`,
    );
  }

  const data = await response.json();

  racks = data.body.map((rack) => {
    return {
      id: rack._id,
      name: rack.name,
    };
  });

  return racks;
}

async function getManufacturers(hostname) {
  const url = new URL("/api/enums/manufacturers", hostname).toString();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch manufacturers from ${url}: ${response.statusText}`,
    );
  }

  const data = await response.json();

  const manufacturers = data.body.map((manufacturer) => {
    return {
      id: manufacturer.value,
      name: manufacturer.name,
    };
  });

  return manufacturers;
}

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

function cleanOptions(options) {
  options.rack = options.rack.id;
  options.manufacturer = options.manufacturer.id;
}

async function submit(hostname, jsonFile, body) {
  const url = new URL("/api/assets", hostname).toString();
  cleanOptions(body);

  body.dataFields = [
    {
      title: "File name",
      value: jsonFile,
    },
  ];

  const rawJson = await fs.readFile(jsonFile, "utf8");

  const requestBody = {
    ...body,
    rawJson,
  };

  console.log(`Submitting ${jsonFile} to URL:${url}, with body:`);
  const str = rawJson;
  console.log({
    ...body,
    rawJson:
      str.length > 50
        ? str.slice(0, 50).replace(/\r?\n/g, "") + "..."
        : str.replace(/\r?\n/g, ""),
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    if (response.status === 409) {
      console.log(`Asset with UUID: '${body.uuid}' already exists`);
      process.exit(1);
    }
    throw new Error(
      `Submission failed: ${response.status} ${response.statusText}`,
    );
  }

  const backendUrl = new URL(
    `/api/assets?id=${body.uuid}`,
    hostname,
  ).toString();

  const frontendUrl = new URL(`/assets?id=${body.uuid}`, hostname).toString();

  console.log("Successful");
  console.log(`Asset URL: ${backendUrl}`);
  console.log(`View Asset: ${frontendUrl}`);

  return await response.json();
}

module.exports = {
  submit,
  extractData,
  getRacks,
  getManufacturers,
};
