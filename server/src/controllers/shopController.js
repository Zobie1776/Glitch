import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import { createCheckoutSession, getProductById } from '../services/stripeService.js';

export async function listProducts(_req, res) {
  res.json({
    products: [
      { id: 'gem_pack_small', name: 'Small Gem Pack', amount: 499, currency: 'usd', gems: 500 },
      { id: 'gem_pack_medium', name: 'Medium Gem Pack', amount: 999, currency: 'usd', gems: 1200 },
      { id: 'gem_pack_large', name: 'Large Gem Pack', amount: 1999, currency: 'usd', gems: 2600 }
    ]
  });
}

export async function checkout(req, res) {
  try {
    const session = await createCheckoutSession(req.user, req.body.productId);
    res.json({ checkoutUrl: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function confirmPurchase(req, res) {
  try {
    const purchase = await Purchase.findOne({ stripeSessionId: req.body.sessionId });
    if (!purchase || purchase.status !== 'complete') {
      return res.status(400).json({ error: 'Purchase not completed' });
    }

    const product = getProductById(purchase.productId);
    if (!product) {
      return res.status(400).json({ error: 'Unknown product' });
    }

    await User.findByIdAndUpdate(purchase.userId, { $inc: { gems: product.gems } });
    res.json({ success: true, gemsAwarded: product.gems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
