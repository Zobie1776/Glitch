const { validationResult } = require('express-validator');

const AVAILABLE_PACKS = [
  { id: 'starter-pack', name: 'Starter Glitch Pack', price: 4.99, gems: 250 },
  { id: 'booster-pack', name: 'Booster Glitch Pack', price: 9.99, gems: 600 },
  { id: 'ascendant-pack', name: 'Ascendant Glitch Pack', price: 19.99, gems: 1400 }
];

exports.list = (_req, res) => {
  res.json(AVAILABLE_PACKS);
};

exports.purchase = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { packId, username } = req.body;
  const pack = AVAILABLE_PACKS.find((item) => item.id === packId);
  if (!pack) {
    return res.status(404).json({ message: 'Pack not found' });
  }

  // In production you would integrate a payment provider (Stripe, etc.)
  res.status(201).json({
    message: 'Purchase simulated',
    pack,
    username,
    transactionId: `sim_${Date.now()}`
  });
};
