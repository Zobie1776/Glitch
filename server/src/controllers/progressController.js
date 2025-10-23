import Progress from '../models/Progress.js';
import User from '../models/User.js';

export async function autoSave(req, res) {
  try {
    const progress = await Progress.saveSnapshot(req.user.id, req.body);
    const update = {
      gems: progress.gems,
      'progress.level': progress.level,
      'progress.lastPlayedAt': new Date()
    };
    if (req.body?.unlockedGlitchSkills) {
      update.unlockedGlitchSkills = req.body.unlockedGlitchSkills;
    }
    if (req.body?.inventory?.gear) {
      Object.entries(req.body.inventory.gear).forEach(([slot, value]) => {
        update[`gearSlots.${slot}`] = value;
      });
    }
    if (req.body?.cosmetics) {
      Object.entries(req.body.cosmetics).forEach(([key, value]) => {
        update[`cosmetics.${key}`] = value;
      });
    }
    await User.findByIdAndUpdate(req.user.id, { $set: update });
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
