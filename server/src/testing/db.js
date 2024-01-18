const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

async function connectTestDb() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

async function clearTestDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.keys(collections).map((name) => collections[name].deleteMany({})));
}

async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { connectTestDb, clearTestDb, disconnectTestDb, authHeader };
