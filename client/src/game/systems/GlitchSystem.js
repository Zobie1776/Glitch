import { GLITCH_REGISTRY } from '../data/glitchRegistry.js';
import { BASE_GLITCH_SLOTS, SPECIAL_GLITCH_SLOTS } from '../constants.js';

export default class GlitchSystem {
  constructor(scene) {
    this.scene = scene;

    // Loadout: 10 base + 5 special slots
    this.baseSlots = new Array(BASE_GLITCH_SLOTS).fill(null);
    this.specialSlots = new Array(SPECIAL_GLITCH_SLOTS).fill(null);

    // Cooldown trackers: { remaining: 0, max: N }
    this.baseCooldowns = new Array(BASE_GLITCH_SLOTS).fill(null).map(() => ({ remaining: 0, max: 0 }));
    this.specialCooldowns = new Array(SPECIAL_GLITCH_SLOTS).fill(null).map(() => ({ remaining: 0, max: 0 }));

    // Unlocked glitches with tier progress: glitchId -> { id, tier }
    this.unlockedGlitches = new Map();

    // Evolution progress: glitchId -> useCount
    this.useCount = new Map();

    this.masteryActive = false;
    this.masteryTimer = 0;

    // Equip starter glitches
    this._equipStarter();
  }

  _equipStarter() {
    this.unlockGlitch('inputDesync');
    this.unlockGlitch('collisionSlip');
    this.unlockGlitch('timeDilation');
    this.equipBase(0, 'inputDesync');
    this.equipBase(1, 'collisionSlip');
    this.equipBase(2, 'timeDilation');
  }

  update(dt) {
    // Tick base cooldowns
    for (let i = 0; i < BASE_GLITCH_SLOTS; i++) {
      if (this.baseCooldowns[i].remaining > 0) {
        this.baseCooldowns[i].remaining = Math.max(0, this.baseCooldowns[i].remaining - dt);
      }
    }
    // Tick special cooldowns
    for (let i = 0; i < SPECIAL_GLITCH_SLOTS; i++) {
      if (this.specialCooldowns[i].remaining > 0) {
        this.specialCooldowns[i].remaining = Math.max(0, this.specialCooldowns[i].remaining - dt);
      }
    }
    // Mastery countdown
    if (this.masteryActive) {
      this.masteryTimer -= dt;
      if (this.masteryTimer <= 0) this.masteryActive = false;
    }
  }

  unlockGlitch(id) {
    if (GLITCH_REGISTRY[id] && !this.unlockedGlitches.has(id)) {
      this.unlockedGlitches.set(id, { id, tier: 1 });
      this.useCount.set(id, 0);
    }
  }

  equipBase(slot, id) {
    if (slot < 0 || slot >= BASE_GLITCH_SLOTS) return;
    if (!this.unlockedGlitches.has(id)) return;
    this.baseSlots[slot] = id;
    const g = GLITCH_REGISTRY[id];
    const tier = this.unlockedGlitches.get(id).tier;
    this.baseCooldowns[slot] = { remaining: 0, max: g.tiers[tier - 1].cooldown };
  }

  equipSpecial(slot, id) {
    if (slot < 0 || slot >= SPECIAL_GLITCH_SLOTS) return;
    if (!this.unlockedGlitches.has(id)) return;
    this.specialSlots[slot] = id;
    const g = GLITCH_REGISTRY[id];
    const tier = this.unlockedGlitches.get(id).tier;
    this.specialCooldowns[slot] = { remaining: 0, max: g.tiers[tier - 1].cooldown };
  }

  activateSlot(slot) {
    const id = this.baseSlots[slot];
    if (!id) return false;
    const cd = this.baseCooldowns[slot];
    if (cd.remaining > 0) return false;

    const glitch = GLITCH_REGISTRY[id];
    if (!glitch) return false;

    const unlockedData = this.unlockedGlitches.get(id);
    const tier = this.masteryActive ? 3 : (unlockedData?.tier ?? 1);
    const tierData = glitch.tiers[tier - 1];

    cd.remaining = tierData.cooldown;
    cd.max = tierData.cooldown;

    try {
      tierData.effect(this.scene, this.scene.player);
    } catch (e) {
      console.warn('Glitch effect error:', e);
    }

    // Track usage for evolution
    const uses = (this.useCount.get(id) || 0) + 1;
    this.useCount.set(id, uses);
    this._checkEvolution(id, uses);

    this.scene.events.emit('glitch:activated', { id, slot, tier });
    return true;
  }

  activateSpecialSlot(slot) {
    const id = this.specialSlots[slot];
    if (!id) return false;
    const cd = this.specialCooldowns[slot];
    if (cd.remaining > 0) return false;

    const glitch = GLITCH_REGISTRY[id];
    if (!glitch) return false;

    const unlockedData = this.unlockedGlitches.get(id);
    const tier = unlockedData?.tier ?? 1;
    const tierData = glitch.tiers[tier - 1];

    cd.remaining = tierData.cooldown;
    cd.max = tierData.cooldown;

    try {
      tierData.effect(this.scene, this.scene.player);
    } catch (e) {
      console.warn('Special glitch effect error:', e);
    }

    this.scene.events.emit('glitch:special', { id, slot, tier });
    return true;
  }

  _checkEvolution(id, uses) {
    const data = this.unlockedGlitches.get(id);
    if (!data) return;
    const glitch = GLITCH_REGISTRY[id];
    if (!glitch) return;

    const thresholds = [0, 8, 20]; // uses to reach tier 2 and 3
    const newTier = uses >= thresholds[2] ? 3 : uses >= thresholds[1] ? 2 : 1;
    if (newTier > data.tier) {
      data.tier = newTier;
      this.scene.events.emit('glitch:evolved', { id, newTier });
      // Flash effect
      this.scene.cameras.main.flash(300, 0, 255, 200, false);
    }
  }

  reduceCooldowns(fraction) {
    for (const cd of this.baseCooldowns) {
      cd.remaining = Math.max(0, cd.remaining * (1 - fraction));
    }
    for (const cd of this.specialCooldowns) {
      cd.remaining = Math.max(0, cd.remaining * (1 - fraction));
    }
  }

  activateMastery(durationMs) {
    this.masteryActive = true;
    this.masteryTimer = durationMs / 1000;
    this.reduceCooldowns(1.0); // reset all cooldowns
  }

  getBaseSlotData(slot) {
    const id = this.baseSlots[slot];
    if (!id) return null;
    const g = GLITCH_REGISTRY[id];
    const tier = this.unlockedGlitches.get(id)?.tier ?? 1;
    const cd = this.baseCooldowns[slot];
    return { id, name: g.name, tier, remaining: cd.remaining, max: cd.max, ready: cd.remaining <= 0 };
  }

  getSpecialSlotData(slot) {
    const id = this.specialSlots[slot];
    if (!id) return null;
    const g = GLITCH_REGISTRY[id];
    const tier = this.unlockedGlitches.get(id)?.tier ?? 1;
    const cd = this.specialCooldowns[slot];
    return { id, name: g.name, tier, remaining: cd.remaining, max: cd.max, ready: cd.remaining <= 0 };
  }

  serialize() {
    return {
      unlocked: Array.from(this.unlockedGlitches.entries()),
      useCount: Array.from(this.useCount.entries()),
      baseSlots: [...this.baseSlots],
      specialSlots: [...this.specialSlots],
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.unlocked) data.unlocked.forEach(([id, val]) => this.unlockedGlitches.set(id, val));
    if (data.useCount) data.useCount.forEach(([id, count]) => this.useCount.set(id, count));
    if (data.baseSlots) data.baseSlots.forEach((id, i) => { if (id) this.equipBase(i, id); });
    if (data.specialSlots) data.specialSlots.forEach((id, i) => { if (id) this.equipSpecial(i, id); });
  }
}
