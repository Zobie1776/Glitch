import mongoose from 'mongoose';
import User from '../models/User.js';
import { getLeaderboardSnapshot, withLeaderboard } from '../services/leaderboardStore.js';

const NINETY_DAYS_MS = 1000 * 60 * 60 * 24 * 90;

function toPlain(entry) {
  return {
    userId: entry.userId?.toString?.() ?? entry.userId,
    displayName: entry.displayName,
    score: entry.score,
    gems: entry.gems,
    level: entry.level,
    updatedAt: entry.updatedAt
  };
}

function ensureSeasonFresh(state) {
  const now = Date.now();
  const seasonStart = state.seasonStart ? new Date(state.seasonStart).getTime() : now;
  if (!Number.isFinite(seasonStart) || now - seasonStart >= NINETY_DAYS_MS) {
    state.seasonStart = new Date(now);
    state.seasonal = [];
  }
}

function updateBoard(state, key, entry) {
  const source = Array.isArray(state[key]) ? state[key] : [];
  const normalized = source.map(toPlain);
  const filtered = normalized.filter((existing) => existing.userId !== entry.userId);
  filtered.push(entry);
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.level !== a.level) return b.level - a.level;
    return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
  });
  const trimmed = filtered.slice(0, 100);
  state[key] = trimmed.map((item) => ({
    ...item,
    userId: item.userId && mongoose.Types.ObjectId.isValid(item.userId)
      ? item.userId
      : item.userId
  }));
}

export async function getLeaderboard(_req, res) {
  try {
    const snapshot = await getLeaderboardSnapshot();
    res.json({
      seasonStart: snapshot.seasonStart,
      allTime: (snapshot.allTime || []).map(toPlain),
      seasonal: (snapshot.seasonal || []).map(toPlain)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getAllTime(_req, res) {
  try {
    const snapshot = await getLeaderboardSnapshot();
    res.json({ leaderboard: (snapshot.allTime || []).map(toPlain) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getSeasonal(_req, res) {
  try {
    const snapshot = await getLeaderboardSnapshot();
    res.json({
      seasonStart: snapshot.seasonStart,
      leaderboard: (snapshot.seasonal || []).map(toPlain)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function submitScore(req, res) {
  try {
    const { score: incomingScore, gems = 0, level = 1 } = req.body || {};
    const score = Number.isFinite(Number(incomingScore)) ? Number(incomingScore) : Number(gems) + level * 10;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const entryPayload = {
      userId: user._id.toString(),
      displayName: user.displayName,
      score,
      gems,
      level,
      updatedAt: new Date()
    };

    await withLeaderboard(async (state) => {
      ensureSeasonFresh(state);
      updateBoard(state, 'allTime', entryPayload);
      updateBoard(state, 'seasonal', entryPayload);
    });

    const snapshot = await getLeaderboardSnapshot();
    if (score > (user.highscores?.allTime ?? 0)) {
      user.highscores.allTime = score;
    }
    if (score > (user.highscores?.seasonal ?? 0)) {
      user.highscores.seasonal = score;
    }
    user.gems = Math.max(user.gems, gems);
    user.progress.level = Math.max(user.progress.level || 1, level);
    await user.save();

    res.json({
      submitted: entryPayload,
      seasonStart: snapshot.seasonStart,
      allTime: (snapshot.allTime || []).map(toPlain),
      seasonal: (snapshot.seasonal || []).map(toPlain)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
