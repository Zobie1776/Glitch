import { Router } from 'express';
import passport from 'passport';
import { login, register, oauthRedirect, logout, currentUser } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

function withStrategy(strategy, handler) {
  return (req, res, next) => {
    if (!passport._strategy(strategy)) {
      return res.status(501).json({ error: `${strategy} OAuth not configured` });
    }
    return handler(req, res, next);
  };
}

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, currentUser);

router.get('/google', withStrategy('google', passport.authenticate('google', { scope: ['profile', 'email'] })));
router.get('/google/callback', withStrategy('google', passport.authenticate('google', { failureRedirect: '/login' })), oauthRedirect);
router.get('/facebook', withStrategy('facebook', passport.authenticate('facebook', { scope: ['email'] })));
router.get('/facebook/callback', withStrategy('facebook', passport.authenticate('facebook', { failureRedirect: '/login' })), oauthRedirect);
router.get('/apple', withStrategy('apple', passport.authenticate('apple')));
router.post('/apple/callback', withStrategy('apple', passport.authenticate('apple', { failureRedirect: '/login' })), oauthRedirect);

export default router;
