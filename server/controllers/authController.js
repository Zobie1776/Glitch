const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

function formatUserPayload(user) {
  return {
    id: user._id ? user._id.toString() : user.id,
    username: user.username,
    xp: user.xp,
    unlockedSkills: user.unlockedSkills || []
  };
}

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const memoryStore = req.app.locals.memoryStore;

  try {
    if (memoryStore) {
      if (memoryStore.users.has(username)) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = {
        id: `mem_${Date.now()}`,
        username,
        passwordHash,
        xp: 0,
        unlockedSkills: []
      };
      memoryStore.users.set(username, user);
      const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: formatUserPayload(user) });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash });
    const token = jwt.sign({ id: user._id, username }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user: formatUserPayload(user) });
  } catch (error) {
    console.error('Registration error', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const memoryStore = req.app.locals.memoryStore;

  try {
    let user;
    if (memoryStore) {
      user = memoryStore.users.get(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: formatUserPayload(user) });
    }

    user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: formatUserPayload(user) });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ message: 'Failed to login' });
  }
};
