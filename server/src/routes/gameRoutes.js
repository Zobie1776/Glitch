import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { autoSave, loadProgress } from '../controllers/progressController.js';

const router = Router();

router.post('/progress', requireAuth, autoSave);
router.get('/progress', requireAuth, loadProgress);

export default router;
