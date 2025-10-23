import mongoose from 'mongoose';
import Leaderboard from '../models/Leaderboard.js';
import { readReplitValue, writeReplitValue } from '../../../config/database.js';

const REPLIT_KEY = 'leaderboard_state';

function isMongoReady() {
  return mongoose.connection?.readyState === 1;
}

function defaultState() {
  return {
    seasonStart: new Date().toISOString(),
    allTime: [],
    seasonal: []
  };
}

async function readStateFromReplit() {
  const raw = await readReplitValue(REPLIT_KEY);
  if (!raw) {
    return defaultState();
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      seasonStart: parsed.seasonStart || new Date().toISOString(),
      allTime: Array.isArray(parsed.allTime) ? parsed.allTime : [],
      seasonal: Array.isArray(parsed.seasonal) ? parsed.seasonal : []
    };
  } catch (error) {
    console.warn('[leaderboard] failed to parse replit payload', error);
    return defaultState();
  }
}

export async function withLeaderboard(mutator) {
  if (isMongoReady()) {
    const doc = await Leaderboard.getSingleton();
    const result = await mutator(doc, true);
    doc.markModified('allTime');
    doc.markModified('seasonal');
    await doc.save();
    return result;
  }

  const state = await readStateFromReplit();
  const result = await mutator(state, false);
  await writeReplitValue(REPLIT_KEY, JSON.stringify(state));
  return result;
}

export async function getLeaderboardSnapshot() {
  if (isMongoReady()) {
    const doc = await Leaderboard.getSingleton();
    return {
      seasonStart: doc.seasonStart,
      allTime: doc.allTime,
      seasonal: doc.seasonal
    };
  }
  return readStateFromReplit();
}
