const SAVE_KEY = 'glitch_rift_save';

export default class SaveSystem {
  save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  clearSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  saveGame(scene) {
    const player = scene.player;
    const glitchSystem = scene.glitchSystem;
    this.save({
      level: scene.currentLevel,
      health: player.health,
      maxHealth: player.maxHealth,
      xp: player.xp,
      playerLevel: player.level,
      gems: player.gems,
      glitches: glitchSystem ? glitchSystem.serialize() : null,
    });
  }

  loadIntoScene(scene) {
    const data = this.load();
    if (!data) return false;

    if (scene.player) {
      scene.player.health = data.health ?? 100;
      scene.player.maxHealth = data.maxHealth ?? 100;
      scene.player.xp = data.xp ?? 0;
      scene.player.level = data.playerLevel ?? 1;
      scene.player.gems = data.gems ?? 0;
    }
    if (scene.glitchSystem && data.glitches) {
      scene.glitchSystem.deserialize(data.glitches);
    }
    return true;
  }
}
