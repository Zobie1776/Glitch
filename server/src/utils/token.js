import jwt from 'jsonwebtoken';
import config from '../../../config/default.js';

export function signToken(payload) {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.tokenExpiresIn
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.auth.jwtSecret);
}
