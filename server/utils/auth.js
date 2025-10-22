const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

exports.authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const [, token] = header.split(' ');
  if (!token) {
    return res.status(401).json({ message: 'Invalid authorization header' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    console.error('Authentication error', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
