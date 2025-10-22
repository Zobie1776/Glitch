const mongoose = require('mongoose');

const GlitchSkillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  unlockedAtLevel: { type: Number, required: true }
});

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    xp: { type: Number, default: 0 },
    unlockedSkills: { type: [GlitchSkillSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
