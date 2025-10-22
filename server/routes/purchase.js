const express = require('express');
const { body } = require('express-validator');

const purchaseController = require('../controllers/purchaseController');
const { authenticate } = require('../utils/auth');

const router = express.Router();

router.get('/', purchaseController.list);
router.post(
  '/',
  authenticate,
  [body('packId').isString(), body('username').isString()],
  purchaseController.purchase
);

module.exports = router;
