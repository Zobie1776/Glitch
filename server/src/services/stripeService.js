import config from '../../../config/default.js';
import { getStripe } from '../../../config/stripe.js';
import Purchase from '../models/Purchase.js';

const PRODUCT_MAP = {
  gem_pack_small: { amount: 499, currency: 'usd', gems: 500 },
  gem_pack_medium: { amount: 999, currency: 'usd', gems: 1200 },
  gem_pack_large: { amount: 1999, currency: 'usd', gems: 2600 }
};

export function getProductById(productId) {
  return PRODUCT_MAP[productId] || null;
}

export async function createCheckoutSession(user, productId) {
  const stripe = getStripe();
  const product = getProductById(productId);

  if (!product) {
    throw new Error('Unknown product');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: product.currency,
          product_data: { name: productId.replace(/_/g, ' ') },
          unit_amount: product.amount
        },
        quantity: 1
      }
    ],
    success_url: `${config.server.baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.server.baseUrl}/shop/cancel`
  });

  await Purchase.create({
    userId: user.id,
    productId,
    amount: product.amount,
    currency: product.currency,
    stripeSessionId: session.id
  });

  return session;
}

export async function fulfillStripeEvent(event) {
  if (event.type !== 'checkout.session.completed') {
    return;
  }

  const session = event.data.object;
  const purchase = await Purchase.findOne({ stripeSessionId: session.id });

  if (!purchase) {
    return;
  }

  purchase.status = 'complete';
  await purchase.save();
}
