import mongoose from 'mongoose';

const leaderboardEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  displayName: { type: String, required: true },
  score: { type: Number, required: true },
  gems: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const leaderboardSchema = new mongoose.Schema({
  seasonStart: { type: Date, default: Date.now },
  allTime: { type: [leaderboardEntrySchema], default: [] },
  seasonal: { type: [leaderboardEntrySchema], default: [] }
}, { timestamps: true });

leaderboardSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

const Leaderboard = mongoose.models.Leaderboard || mongoose.model('Leaderboard', leaderboardSchema);
export default Leaderboard;
