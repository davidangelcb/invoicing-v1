const { database } = require("../model");
const properties = database.collection("properties");
const ObjectId = require("mongodb").ObjectId;


const Properties = {
  insert: async (obj) => {
    return await invoices.insertOne(obj);
  },
  findByName: async (nameCompany) => {
    const query = { name: nameCompany, activeRecord : true };
    const options = {
      projection: { activeRecord: 0 },
    };
    const propertie = await properties.findOne(query, options);
    if (propertie) {
      return propertie;
    }
    return null
  } 
}

exports.Properties = Properties;
