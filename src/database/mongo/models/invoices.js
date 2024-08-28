const { database } = require("../model");
const invoices = database.collection("invoices");
const ObjectId = require("mongodb").ObjectId;


const Invoices = {
  insert: async (obj) => {
    return await invoices.insertOne(obj);
  },
  findByRef: async (company, number) => {
    const query = {CompanyName: company, InvoiceNumber : number };
    const options = {
      projection: { activeRecord: 0 },
    };
    const bill = await invoices.findOne(query, options);
    if (bill) {
      return bill;
    }
    return null
  } 
}

exports.Invoices = Invoices;
