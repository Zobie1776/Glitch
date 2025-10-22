import User from '../models/User.js';
import Progress from '../models/Progress.js';
import { signToken } from '../utils/token.js';

export async function register(req, res) {
  const { email, password, displayName } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.registerLocalUser({ email, password, displayName });
    await Progress.create({ userId: user._id });
    const token = signToken({ id: user._id, displayName: user.displayName });
    res.status(201).json({ token, user: { id: user._id, displayName: user.displayName } });
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

    const token = signToken({ id: user._id, displayName: user.displayName });
    res.json({ token, user: { id: user._id, displayName: user.displayName } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function oauthRedirect(req, res) {
  const token = signToken({ id: req.user._id, displayName: req.user.displayName });
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth?token=${token}`);
}

export function currentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({ user: req.user });
}
