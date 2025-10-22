import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getLeaderboard, submitScore } from '../controllers/leaderboardController.js';

const router = Router();

router.get('/', getLeaderboard);
router.post('/', requireAuth, submitScore);

export default router;
