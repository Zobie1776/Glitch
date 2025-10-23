import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: String, required: true },
  kind: { type: String, enum: ['gems', 'subscription'], default: 'gems' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  stripeSessionId: { type: String },
  status: { type: String, enum: ['pending', 'complete', 'failed'], default: 'pending' },
  metadata: { type: Map, of: String }
}, { timestamps: true });

const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);
export default Purchase;
