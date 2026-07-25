import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getStats, toggleSuspendUser, getTableRecords, deleteTableRecord } from '../controllers/admin.controller';

const router = Router();

router.get('/stats', requireAuth, requireRole('ADMIN'), getStats);
router.patch('/users/:userId/suspend', requireAuth, requireRole('ADMIN'), toggleSuspendUser);
router.get('/tables/:tableName', requireAuth, requireRole('ADMIN'), getTableRecords);
router.delete('/tables/:tableName/:id', requireAuth, requireRole('ADMIN'), deleteTableRecord);

export default router;
