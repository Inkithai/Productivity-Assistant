const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Newer distros (Debian 12+) only ship 7.x binaries.
const MONGO_BINARY_VERSION = '7.0.14';

async function connectTestDb() {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: MONGO_BINARY_VERSION },
  });
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
