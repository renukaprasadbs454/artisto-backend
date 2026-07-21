import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getStats, toggleSuspendUser } from '../controllers/admin.controller';

const router = Router();

router.get('/stats', requireAuth, requireRole('ADMIN'), getStats);
router.patch('/users/:userId/suspend', requireAuth, requireRole('ADMIN'), toggleSuspendUser);

export default router;
