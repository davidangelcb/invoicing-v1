const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);
exports.database = client.db(process.env.MONGODB_DATABASE);
