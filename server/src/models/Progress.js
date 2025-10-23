import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  level: { type: Number, default: 1 },
  gems: { type: Number, default: 0 },
  stats: {
    health: { type: Number, default: 100 },
    glitchEnergy: { type: Number, default: 0 }
  },
  inventory: {
    consumables: [{ id: String, quantity: Number }],
    upgrades: [{ id: String, level: Number }],
    gear: {
      helm: { type: Object, default: () => ({}) },
      body: { type: Object, default: () => ({}) },
      gloves: { type: Object, default: () => ({}) },
      leggings: { type: Object, default: () => ({}) },
      accessory: { type: Object, default: () => ({}) }
    }
  },
  unlockedGlitchSkills: [{ type: String }],
  cosmetics: {
    equippedSkin: { type: String, default: 'default-rift-runner' },
    trail: { type: String, default: 'standard' }
  }
}, { timestamps: true });

progressSchema.statics.saveSnapshot = async function saveSnapshot(userId, payload = {}) {
  const update = {};

  if (typeof payload.level !== 'undefined') update.level = payload.level;
  if (typeof payload.gems !== 'undefined') update.gems = payload.gems;
  if (payload.stats) update.stats = payload.stats;
  if (payload.inventory) update.inventory = payload.inventory;
  if (payload.unlockedGlitchSkills) update.unlockedGlitchSkills = payload.unlockedGlitchSkills;
  if (payload.cosmetics) update.cosmetics = payload.cosmetics;

  return this.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, upsert: true }
  );
};

const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
export default Progress;
