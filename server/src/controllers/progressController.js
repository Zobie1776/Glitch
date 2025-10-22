import Progress from '../models/Progress.js';
import User from '../models/User.js';

export async function autoSave(req, res) {
  try {
    const progress = await Progress.saveSnapshot(req.user.id, req.body);
    await User.findByIdAndUpdate(req.user.id, { gems: progress.gems });
    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function loadProgress(req, res) {
  try {
    const progress = await Progress.findOne({ userId: req.user.id });
    if (!progress) {
      return res.status(404).json({ error: 'No progress found' });
    }

    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
