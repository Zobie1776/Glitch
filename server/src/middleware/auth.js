import { verifyToken } from '../utils/token.js';

const COOKIE_NAME = 'glitch_session';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const bearerToken = header.replace('Bearer ', '');
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    if (!req.user.token) {
      req.user.token = token;
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export const sessionCookieName = COOKIE_NAME;
