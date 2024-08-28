const { Invoices } = require("../database/mongo/models/invoices");
const { Properties } = require("../database/mongo/models/properties");
const { Funcs } = require("../lib/misc/funcs");

module.exports.pdf = async (fiels) => {
  let response = {
    status: "error",
    code: 500,
    message: "Malformed payload",
  };
  const fs = require("fs");
  // Lee el archivo PDF
  const filePath = fiels.id; // Reemplaza con la ruta a tu archivo PDF

  let property = await Properties.findByName(fiels.name);

  if (property == null) {
    response.code = 400;
    response.message = "Property Not Found!";
    return response;
  }

  try {
    let dataFile = fs.readFileSync(filePath);

    let dataPdf = await Funcs.getDataFromBuffer(dataFile);

    if (dataPdf.length > 0) {
      console.table(dataPdf);
      let dataBase = Funcs.makeFiels(dataPdf, property.fields);

      // inssert DB
      const today = new Date();
      let dbBill = {
        ...dataBase,
        idProperty: property._id,
        activeRecord: true,
        createdAt: today,
        updatedAt: today,
      };
      await Invoices.insert(dbBill);

      // insert New Relic

      response.code = 200;
      response.message = "File and data was processed";
      response.status = "Done";
    } else {
      response.code = 200;
      response.message = "File and data was processed empty";
      response.status = "Done";
    }
  } catch (error) {
    response.code = 500;
    response.message = error.message;
  }

  return response;
};
