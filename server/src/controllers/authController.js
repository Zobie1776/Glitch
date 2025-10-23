import User from '../models/User.js';
import Progress from '../models/Progress.js';
import { signToken } from '../utils/token.js';
import { sessionCookieName } from '../middleware/auth.js';

const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

function setSession(res, user) {
  const payload = { id: user._id.toString(), displayName: user.displayName };
  const token = signToken(payload);
  res.cookie(sessionCookieName, token, COOKIE_OPTIONS);
  return { token, user: user.toSafeObject() };
}

export async function register(req, res) {
  const { email, password, displayName } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.registerLocalUser({ email, password, displayName });
    await Progress.create({ userId: user._id });
    const session = setSession(res, user);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const session = setSession(res, user);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function oauthRedirect(req, res) {
  const session = setSession(res, req.user);
  const redirectUrl = new URL(`${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth`);
  redirectUrl.searchParams.set('token', session.token);
  res.redirect(redirectUrl.toString());
}

export async function currentUser(req, res) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function logout(_req, res) {
  res.clearCookie(sessionCookieName, { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ success: true });
}
