const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDatabase, getMemoryStore } = require('./utils/db');
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');
const purchaseRoutes = require('./routes/purchase');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

app.use(cors());
app.use(express.json());
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.static(FRONTEND_DIR));

app.use((req, _res, next) => {
  req.app.locals.memoryStore = getMemoryStore();
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/purchase', purchaseRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: app.locals.memoryStore ? 'memory' : 'mongo',
    version: '0.1.0'
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

async function start() {
  await connectDatabase();
  app.locals.memoryStore = getMemoryStore();

  app.listen(PORT, () => {
    console.log(`GLITCH//RIFT backend listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to boot server', error);
  process.exit(1);
});
