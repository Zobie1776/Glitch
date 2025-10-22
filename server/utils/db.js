const mongoose = require('mongoose');

const memoryStore = {
  users: new Map(),
  leaderboard: []
};

async function connectDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('MONGO_URI not provided. Falling back to in-memory store. Scores and users will not persist.');
    return;
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB || 'glitch_rift'
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection failed. Falling back to in-memory store.', error);
  }
}

function getMemoryStore() {
  if (mongoose.connection.readyState === 1) {
    return null;
  }
  return memoryStore;
}

module.exports = {
  connectDatabase,
  getMemoryStore
};
