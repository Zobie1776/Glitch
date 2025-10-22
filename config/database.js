import mongoose from 'mongoose';
import fetch from 'node-fetch';
import config from './default.js';

let isConnected = false;

export async function connectDatabase() {
  if (config.database.uri) {
    if (isConnected) {
      return mongoose.connection;
    }

    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    isConnected = true;
    return mongoose.connection;
  }

  if (!config.database.replitKey) {
    throw new Error('No database configuration provided.');
  }

  return null;
}

export async function readReplitValue(key) {
  if (!config.database.replitKey) {
    throw new Error('Replit DB URL not configured.');
  }

  const response = await fetch(`${config.database.replitKey}/${key}`);
  if (!response.ok) {
    return null;
  }
  return response.text();
}

export async function writeReplitValue(key, value) {
  if (!config.database.replitKey) {
    throw new Error('Replit DB URL not configured.');
  }

  const response = await fetch(config.database.replitKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [key]: value })
  });

  if (!response.ok) {
    throw new Error('Failed to write to Replit DB');
  }
}
