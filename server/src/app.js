import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import config from '../../config/default.js';
import { configurePassport } from '../../config/oauth.js';
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import playerRoutes from './routes/playerRoutes.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use('/api/webhooks', webhookRoutes);
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: config.auth.sessionSecret,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/players', playerRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
