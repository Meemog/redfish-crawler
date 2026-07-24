const { parseArgs } = require("../args/submit");
const {
  submit,
  extractData,
  getRacks,
  getManufacturers,
} = require("../methods/submitter");
const { confirm, select, input } = require("@inquirer/prompts");
const Table = require("cli-table3");

async function selectReferenceField(items, message) {
  return await select({
    message,
    choices: items.map((item) => ({
      name: item.name,
      value: item,
    })),
  });
}

function showTable(data) {
  const table = new Table({
    head: ["Field", "Value"],
    colWidths: [20, 50],
  });

  for (const [field, value] of Object.entries(data)) {
    table.push([
      field,
      typeof value === "object" ? `${value.name} (${value.id})` : String(value),
    ]);
  }

  console.log(table.toString());
}

async function editData(data, { racks, manufacturers }) {
  while (true) {
    console.clear();

    showTable(data);

    const field = await select({
      message: "Select a field to edit",
      choices: [
        ...Object.keys(data).map((key) => ({
          name: key,
          value: key,
        })),
        {
          name: "Done editing",
          value: null,
        },
      ],
    });

    if (field === null) {
      return data;
    }

    if (field === "rack") {
      data.rack = await selectReferenceField(racks, "Select rack:");

      continue;
    }

    if (field === "manufacturer") {
      data.manufacturer = await selectReferenceField(
        manufacturers,
        "Select manufacturer:",
      );
      continue;
    }

    data[field] = await input({
      message: `New value for ${field}:`,
      default: String(data[field]),
    });
  }
}

async function getOtherFields(data, { racks, manufacturers }) {
  const toReturn = {
    manufacturer: null,
    rack: null,
    uPosition: data.uPosition,
    notes: data.notes,
  };

  const selectedRack = await selectReferenceField(racks, "Select rack:");

  toReturn.rack = selectedRack;

  const selectedManufacturer = await selectReferenceField(
    manufacturers,
    "Select manufacturer:",
  );

  toReturn.manufacturer = selectedManufacturer;

  if (!toReturn.uPosition) {
    toReturn.uPosition = await input({
      message: "Enter U position:",
      default: "0",
    });
  }

  if (!toReturn.notes) {
    toReturn.notes = await input({
      message: "Enter submission notes (optional):",
      default: "",
    });
  }

  return toReturn;
}

async function submitCommand(argv, commandName) {
  const args = parseArgs(argv, commandName);

  const racks = await getRacks(args.api);
  const manufacturers = await getManufacturers(args.api);

  let data = await extractData(args.file);

  const otherFields = await getOtherFields(args, {
    racks,
    manufacturers,
  });

  data = {
    ...data,
    ...otherFields,
  };

  showTable(data);

  const edit = await confirm({
    message: "Do you want to edit any fields?",
    default: false,
  });

  if (edit) {
    data = await editData(data, {
      racks,
      manufacturers,
    });
  }

  const confirmation = await confirm({
    message: "Submit this data?",
    default: false,
  });

  if (confirmation) {
    submit(args.api, args.file, data);
  }
}

module.exports = {
  submitCommand,
};
