import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getLeaderboard, getAllTime, getSeasonal, submitScore } from '../controllers/leaderboardController.js';

const router = Router();

router.get('/', getLeaderboard);
router.get('/all-time', getAllTime);
router.get('/seasonal', getSeasonal);
router.post('/', requireAuth, submitScore);

export default router;
