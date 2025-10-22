import { Router } from 'express';
import passport from 'passport';
import { login, register, oauthRedirect } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), oauthRedirect);
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), oauthRedirect);

export default router;
