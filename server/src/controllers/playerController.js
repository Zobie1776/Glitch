import User from '../models/User.js';
import Progress from '../models/Progress.js';

function mergeIfDefined(target, patch) {
  Object.entries(patch).forEach(([key, value]) => {
    if (typeof value === 'undefined') return;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key]) target[key] = {};
      mergeIfDefined(target[key], value);
    } else {
      target[key] = value;
    }
  });
}

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ player: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const allowed = (({ displayName, stats }) => ({ displayName, stats }))(req.body || {});
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (allowed.displayName) {
      user.displayName = allowed.displayName;
    }
    if (allowed.stats) {
      mergeIfDefined(user.stats, allowed.stats);
    }
    await user.save();
    res.json({ player: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateInventory(req, res) {
  try {
    const { gearSlots, unlockedGlitchSkills } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (gearSlots) {
      Object.entries(gearSlots).forEach(([slot, data]) => {
        if (!user.gearSlots[slot]) {
          user.gearSlots[slot] = {};
        }
        mergeIfDefined(user.gearSlots[slot], data || {});
      });
    }
    if (Array.isArray(unlockedGlitchSkills)) {
      const unique = new Set([...user.unlockedGlitchSkills, ...unlockedGlitchSkills]);
      user.unlockedGlitchSkills = Array.from(unique);
    }
    await user.save();
    res.json({ player: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateCosmetics(req, res) {
  try {
    const { cosmetics } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (cosmetics) {
      mergeIfDefined(user.cosmetics, cosmetics);
      if (Array.isArray(cosmetics.ownedSkins)) {
        const unique = new Set([...(user.cosmetics.ownedSkins || []), ...cosmetics.ownedSkins]);
        user.cosmetics.ownedSkins = Array.from(unique);
      }
    }
    await user.save();
    res.json({ player: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateProgressState(req, res) {
  try {
    const { level, gems, highscores } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (typeof level === 'number') {
      user.progress.level = level;
      user.progress.lastPlayedAt = new Date();
    }
    if (typeof gems === 'number') {
      user.gems = gems;
    }
    if (highscores) {
      mergeIfDefined(user.highscores, highscores);
    }
    await user.save();
    await Progress.saveSnapshot(req.user.id, { level, gems });
    res.json({ player: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
