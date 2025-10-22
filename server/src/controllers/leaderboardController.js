import Progress from '../models/Progress.js';
import User from '../models/User.js';

export async function getLeaderboard(_req, res) {
  try {
    const entries = await Progress.find()
      .sort({ gems: -1, updatedAt: -1 })
      .limit(25)
      .lean();

    const leaderboard = await Promise.all(entries.map(async (progress) => {
      const user = await User.findById(progress.userId).lean();
      return {
        player: user?.displayName || 'Unknown',
        level: progress.level,
        gems: progress.gems,
        updatedAt: progress.updatedAt
      };
    }));

    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function submitScore(req, res) {
  try {
    const { gems, level } = req.body;
    const progress = await Progress.saveSnapshot(req.user.id, { gems, level });
    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
