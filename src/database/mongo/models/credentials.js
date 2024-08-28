const { database } = require("../model");
const credentials = database.collection("credentials");
const ObjectId = require("mongodb").ObjectId;


const Credentials = {
  insert: async (obj) => {
    return await credentials.insertOne(obj);
  },
  findByType: async (typeCredential) => {
    const query = { type: typeCredential };
    const options = {
      projection: { activeRecord: 0 },
    };
    const bill = await credentials.findOne(query, options);
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
    return await credentials.updateOne(filter, updateDoc, options);
  }
}

exports.Credentials = Credentials;
