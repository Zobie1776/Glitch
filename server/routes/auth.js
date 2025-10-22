const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');

const router = express.Router();

const credentialsValidator = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

router.post('/register', credentialsValidator, authController.register);
router.post('/login', credentialsValidator, authController.login);

module.exports = router;
