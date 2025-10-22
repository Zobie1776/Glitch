import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String },
  displayName: { type: String, required: true },
  oauthProviders: [{
    provider: String,
    providerId: String
  }],
  gems: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.methods.verifyPassword = async function verifyPassword(password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.registerLocalUser = async function registerLocalUser({ email, password, displayName }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return this.create({ email, passwordHash, displayName });
};

userSchema.statics.findOrCreateOAuthUser = async function findOrCreateOAuthUser(provider, profile) {
  const providerId = profile.id;
  let user = await this.findOne({ 'oauthProviders.provider': provider, 'oauthProviders.providerId': providerId });

  if (!user) {
    user = await this.create({
      displayName: profile.displayName || profile.emails?.[0]?.value || 'Player',
      email: profile.emails?.[0]?.value,
      oauthProviders: [{ provider, providerId }]
    });
  }

  return user;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
