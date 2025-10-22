import { Router } from 'express';
import bodyParser from 'body-parser';
import config from '../../../config/default.js';
import { getStripe } from '../../../config/stripe.js';
import { fulfillStripeEvent } from '../services/stripeService.js';

const router = Router();

router.post('/stripe', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe();
  const signature = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, signature, config.stripe.webhookSecret);
    await fulfillStripeEvent(event);
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
