import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listProducts, checkout, confirmPurchase, subscribe } from '../controllers/shopController.js';

const router = Router();

router.get('/products', listProducts);
router.post('/checkout', requireAuth, checkout);
router.post('/confirm', requireAuth, confirmPurchase);
router.post('/subscription', requireAuth, subscribe);

export default router;
