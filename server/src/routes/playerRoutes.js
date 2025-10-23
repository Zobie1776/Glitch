import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  updateInventory,
  updateCosmetics,
  updateProgressState
} from '../controllers/playerController.js';

const router = Router();

router.use(requireAuth);
router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.patch('/me/inventory', updateInventory);
router.patch('/me/cosmetics', updateCosmetics);
router.patch('/me/progress', updateProgressState);

export default router;
