const express = require('express');
const { body } = require('express-validator');

const leaderboardController = require('../controllers/leaderboardController');
const { authenticate } = require('../utils/auth');

const router = express.Router();

router.get('/', leaderboardController.list);
router.post(
  '/',
  authenticate,
  [
    body('username').isString(),
    body('score').isInt({ min: 0 }),
    body('level').isInt({ min: 1, max: 50 })
  ],
  leaderboardController.submit
);

module.exports = router;
