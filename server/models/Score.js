const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    score: { type: Number, required: true },
    level: { type: Number, required: true }
  },
  { timestamps: true }
);

ScoreSchema.index({ username: 1, level: 1 }, { unique: true });

module.exports = mongoose.models.Score || mongoose.model('Score', ScoreSchema);
