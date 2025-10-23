import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const gearSlotSchema = new mongoose.Schema({
  itemId: { type: String, default: null },
  rarity: { type: String, default: null },
  name: { type: String, default: null }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String },
  displayName: { type: String, required: true },
  oauthProviders: [{
    provider: String,
    providerId: String
  }],
  oauthIds: {
    google: { type: String },
    apple: { type: String },
    facebook: { type: String }
  },
  gems: { type: Number, default: 0 },
  stats: {
    hp: { type: Number, default: 100 },
    attack: { type: Number, default: 10 },
    attackSpeed: { type: Number, default: 1 },
    defense: { type: Number, default: 0 },
    critChance: { type: Number, default: 5 },
    cooldownAccel: { type: Number, default: 0 },
    moveSpeed: { type: Number, default: 100 }
  },
  unlockedGlitchSkills: { type: [String], default: [] },
  gearSlots: {
    helm: { type: gearSlotSchema, default: () => ({}) },
    body: { type: gearSlotSchema, default: () => ({}) },
    gloves: { type: gearSlotSchema, default: () => ({}) },
    leggings: { type: gearSlotSchema, default: () => ({}) },
    accessory: { type: gearSlotSchema, default: () => ({}) }
  },
  cosmetics: {
    ownedSkins: { type: [String], default: [] },
    equippedSkin: { type: String, default: 'default-rift-runner' },
    trail: { type: String, default: 'standard' }
  },
  subscriptionActive: { type: Boolean, default: false },
  progress: {
    level: { type: Number, default: 1 },
    checkpointsUnlocked: { type: Number, default: 0 },
    lastPlayedAt: { type: Date, default: Date.now }
  },
  highscores: {
    allTime: { type: Number, default: 0 },
    seasonal: { type: Number, default: 0 }
  }
}, { timestamps: true });

userSchema.methods.verifyPassword = async function verifyPassword(password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const {
    _id,
    email,
    displayName,
    gems,
    stats,
    unlockedGlitchSkills,
    gearSlots,
    cosmetics,
    subscriptionActive,
    progress,
    highscores
  } = this.toObject({ virtuals: false });

  return {
    id: _id.toString(),
    email,
    displayName,
    gems,
    stats,
    unlockedGlitchSkills,
    gearSlots,
    cosmetics,
    subscriptionActive,
    progress,
    highscores
  };
};

userSchema.statics.registerLocalUser = async function registerLocalUser({ email, password, displayName }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await this.create({ email, passwordHash, displayName });
  return user;
};

userSchema.statics.findOrCreateOAuthUser = async function findOrCreateOAuthUser(provider, profile) {
  const providerId = profile.id;
  let user = await this.findOne({ 'oauthProviders.provider': provider, 'oauthProviders.providerId': providerId });

  if (!user) {
    user = await this.create({
      displayName: profile.displayName || profile.emails?.[0]?.value || 'Player',
      email: profile.emails?.[0]?.value,
      oauthProviders: [{ provider, providerId }],
      oauthIds: { [provider]: providerId }
    });
  } else {
    const existingProvider = user.oauthProviders.find((record) => record.provider === provider && record.providerId === providerId);
    if (!existingProvider) {
      user.oauthProviders.push({ provider, providerId });
    }
    user.oauthIds = { ...user.oauthIds, [provider]: providerId };
    if (!user.displayName && profile.displayName) {
      user.displayName = profile.displayName;
    }
    if (!user.email && profile.emails?.[0]?.value) {
      user.email = profile.emails[0].value;
    }
    await user.save();
  }

  return user;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
