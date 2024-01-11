const mongoose = require('mongoose');
const config = require('./env');

const RETRY_DELAYS = [1000, 2000, 5000];

async function connectDatabase(uri = config.mongoUri, attempt = 0) {
  try {
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB (${mongoose.connection.name})`);
    return mongoose.connection;
  } catch (err) {
    if (attempt >= RETRY_DELAYS.length) {
      throw err;
    }
    const delay = RETRY_DELAYS[attempt];
    console.warn(`MongoDB connection failed, retrying in ${delay}ms:`, err.message);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectDatabase(uri, attempt + 1);
  }
}

module.exports = { connectDatabase };
