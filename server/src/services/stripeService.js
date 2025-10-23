import config from '../../../config/default.js';
import { getStripe } from '../../../config/stripe.js';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';

const PRODUCT_MAP = {
  gem_pack_small: { amount: 299, currency: 'usd', gems: 300, priceId: config.stripe.gemProducts.small },
  gem_pack_medium: { amount: 599, currency: 'usd', gems: 700, priceId: config.stripe.gemProducts.medium },
  gem_pack_large: { amount: 999, currency: 'usd', gems: 1600, priceId: config.stripe.gemProducts.large }
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

  const lineItem = product.priceId
    ? { price: product.priceId, quantity: 1 }
    : {
        price_data: {
          currency: product.currency,
          product_data: { name: productId.replace(/_/g, ' ') },
          unit_amount: product.amount
        },
        quantity: 1
      };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: user.email,
    line_items: [lineItem],
    metadata: { userId: user.id, productId, kind: 'gems' },
    success_url: `${config.server.baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.server.baseUrl}/shop/cancel`
  });

  await Purchase.create({
    userId: user.id,
    productId,
    kind: 'gems',
    amount: product.amount,
    currency: product.currency,
    stripeSessionId: session.id,
    metadata: new Map(Object.entries({ gems: String(product.gems) }))
  });

  return session;
}

export async function createSubscriptionSession(user) {
  const stripe = getStripe();
  if (!config.stripe.subscriptionPriceId) {
    throw new Error('Subscription price not configured');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{ price: config.stripe.subscriptionPriceId, quantity: 1 }],
    metadata: { userId: user.id, kind: 'subscription' },
    success_url: `${config.server.baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.server.baseUrl}/shop/cancel`
  });

  await Purchase.create({
    userId: user.id,
    productId: 'subscription_monthly',
    kind: 'subscription',
    amount: 299,
    currency: 'usd',
    stripeSessionId: session.id
  });

  return session;
}

async function completeGemPurchase(purchase) {
  const product = getProductById(purchase.productId);
  if (!product) {
    return;
  }
  const user = await User.findById(purchase.userId);
  if (!user) {
    return;
  }
  user.gems += product.gems;
  await user.save();
  purchase.metadata = new Map([...(purchase.metadata || []), ['redeemed', 'true']]);
  await purchase.save();
}

async function enableSubscription(purchase, session) {
  const user = await User.findById(purchase.userId);
  if (!user) {
    return;
  }
  user.subscriptionActive = true;
  if (session?.subscription) {
    purchase.metadata = new Map([...(purchase.metadata || []), ['subscriptionId', session.subscription]]);
    await purchase.save();
  } else {
    await purchase.save();
  }
  await user.save();
}

export async function fulfillStripeEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const purchase = await Purchase.findOne({ stripeSessionId: session.id });
      if (!purchase) return;

      purchase.status = 'complete';
      await purchase.save();

      if (purchase.kind === 'gems') {
        await completeGemPurchase(purchase);
      } else if (purchase.kind === 'subscription') {
        await enableSubscription(purchase, session);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const purchase = await Purchase.findOne({ 'metadata.subscriptionId': subscription.id });
      if (!purchase) return;
      const user = await User.findById(purchase.userId);
      if (!user) return;
      user.subscriptionActive = false;
      await user.save();
      break;
    }
    default:
      break;
  }
}
