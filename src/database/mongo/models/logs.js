const { database } = require("../model");
const logs = database.collection("logs");
const ObjectId = require("mongodb").ObjectId;


const Logs = {
  insert: async (obj) => {
    return await logs.insertOne(obj);
  },
  findByType: async (typeCredential) => {
    const query = { type: typeCredential };
    const options = {
      projection: { activeRecord: 0 },
    };
    const bill = await logs.findOne(query, options);
    if (bill) {
      return bill;
    }
    return null
  } 
  ,
  updateById: async (id, updateset) => {
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: false }; // Do not create document if no documents match the filter
    const updateDoc = {
      $set: {
        ...updateset,
      },
    };
    return await logs.updateOne(filter, updateDoc, options);
  }
}

exports.Logs = Logs;
