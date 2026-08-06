import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getStats, toggleSuspendUser, getTableRecords, deleteTableRecord, forcePasswordReset, updateUserRole, createUser, updateUserPassword, toggleSubscription, reconcilePayment, updateSubscription, updatePayment, updateRecruitment } from '../controllers/admin.controller';

const router = Router();

router.get('/stats', requireAuth, requireRole('ADMIN'), getStats);
router.patch('/users/:userId/suspend', requireAuth, requireRole('ADMIN'), toggleSuspendUser);
router.post('/users', requireAuth, requireRole('ADMIN'), createUser);
router.patch('/users/:userId/role', requireAuth, requireRole('ADMIN'), updateUserRole);
router.patch('/users/:userId/password', requireAuth, requireRole('ADMIN'), updateUserPassword);
router.patch('/users/:userId/force-password-reset', requireAuth, requireRole('ADMIN'), forcePasswordReset);
router.get('/tables/:tableName', requireAuth, requireRole('ADMIN'), getTableRecords);
router.delete('/tables/:tableName/:id', requireAuth, requireRole('ADMIN'), deleteTableRecord);
router.patch('/subscriptions/:id/toggle', requireAuth, requireRole('ADMIN'), toggleSubscription);
router.post('/payments/:id/reconcile', requireAuth, requireRole('ADMIN'), reconcilePayment);
router.patch('/subscriptions/:id', requireAuth, requireRole('ADMIN'), updateSubscription);
router.patch('/payments/:id', requireAuth, requireRole('ADMIN'), updatePayment);
router.patch('/recruitments/:id', requireAuth, requireRole('ADMIN'), updateRecruitment);

export default router;
