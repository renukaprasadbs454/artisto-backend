import { Router } from 'express';
import { requireAuth, requireRole, requireProfileComplete } from '../middleware/auth';
import {
  getSellerDashboard,
  getBuyerDashboard,
} from '../controllers/dashboard.controller';

const router = Router();

// GET /api/v1/dashboard/seller — requires auth + SELLER role
router.get('/seller', requireAuth, requireProfileComplete, requireRole('SELLER'), getSellerDashboard);

// GET /api/v1/dashboard/buyer — requires auth (any authenticated user can view their buyer stats)
router.get('/buyer', requireAuth, requireProfileComplete, getBuyerDashboard);

export default router;
