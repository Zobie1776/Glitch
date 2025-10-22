import Stripe from 'stripe';
import config from './default.js';

let stripeClient;

export function getStripe() {
  if (!stripeClient) {
    if (!config.stripe.secretKey) {
      throw new Error('Stripe secret key not configured.');
    }

    stripeClient = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-10-16'
    });
  }

  return stripeClient;
}
