import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import { createCheckoutSession, createSubscriptionSession, getProductById } from '../services/stripeService.js';

const COSMETIC_ITEMS = [
  { id: 'skin_cyber_ronin', name: 'Cyber Ronin', cost: 1200, type: 'skin' },
  { id: 'skin_void_drifter', name: 'Void Drifter', cost: 1500, type: 'skin' },
  { id: 'trail_singularity', name: 'Singularity Trail', cost: 800, type: 'trail' }
];

export async function listProducts(_req, res) {
  res.json({
    products: [
      { id: 'gem_pack_small', name: 'Small Gem Pack', amount: 299, currency: 'usd', gems: 300 },
      { id: 'gem_pack_medium', name: 'Medium Gem Pack', amount: 599, currency: 'usd', gems: 700 },
      { id: 'gem_pack_large', name: 'Large Gem Pack', amount: 999, currency: 'usd', gems: 1600 }
    ],
    subscription: { id: 'subscription_monthly', name: 'Ad-Free Rift Pass', amount: 299, currency: 'usd', perks: ['Ad-free runs', 'Monthly glitch skin drop'] },
    cosmetics: COSMETIC_ITEMS
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

    if (purchase.metadata?.get('redeemed') === 'true') {
      return res.json({ success: true, gemsAwarded: product.gems, alreadyRedeemed: true });
    }

    await User.findByIdAndUpdate(purchase.userId, { $inc: { gems: product.gems } });
    purchase.metadata = new Map([...(purchase.metadata || []), ['redeemed', 'true']]);
    await purchase.save();
    res.json({ success: true, gemsAwarded: product.gems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function subscribe(req, res) {
  try {
    const session = await createSubscriptionSession(req.user);
    res.json({ checkoutUrl: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
