const { validationResult } = require('express-validator');

const Score = require('../models/Score');

exports.list = async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    if (memoryStore) {
      const topScores = memoryStore.leaderboard
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);
      return res.json(topScores);
    }

    const scores = await Score.find().sort({ score: -1 }).limit(50);
    res.json(scores);
  } catch (error) {
    console.error('Failed to load leaderboard', error);
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
};

exports.submit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, score, level } = req.body;

  try {
    const memoryStore = req.app.locals.memoryStore;
    if (memoryStore) {
      const existingIndex = memoryStore.leaderboard.findIndex(
        (entry) => entry.username === username && entry.level === level
      );
      if (existingIndex >= 0) {
        memoryStore.leaderboard[existingIndex].score = Math.max(
          memoryStore.leaderboard[existingIndex].score,
          score
        );
      } else {
        memoryStore.leaderboard.push({ username, score, level, updatedAt: new Date() });
      }
      return res.status(201).json({ message: 'Score recorded (memory)' });
    }

    const updated = await Score.findOneAndUpdate(
      { username, level },
      { username, score, level },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(updated);
  } catch (error) {
    console.error('Failed to submit score', error);
    res.status(500).json({ message: 'Failed to submit score' });
  }
};
