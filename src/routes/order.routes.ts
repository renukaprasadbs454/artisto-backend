import { Router } from 'express';
import { requireAuth, requireProfileComplete } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  createOrderSchema,
  updateOrderStatusSchema,
  getRecruiterApplications,
  approveApplication,
  grantMessagingPermission,
  revokeMessagingPermission,
} from '../controllers/order.controller';

const router = Router();

// POST /api/v1/orders — requires auth
router.post('/', requireAuth, requireProfileComplete, validate(createOrderSchema), createOrder);

// GET /api/v1/orders — requires auth (returns current user's orders)
router.get('/', requireAuth, requireProfileComplete, getOrders);

// GET /api/v1/orders/recruiter-applications — recruiter sees all job applications (sorted by status)
router.get('/recruiter-applications', requireAuth, requireProfileComplete, getRecruiterApplications);

// POST /api/v1/orders/:id/approve-application — recruiter approves.
// Optional body `grantMessaging` controls whether conversation is created.
router.post('/:id/approve-application', requireAuth, requireProfileComplete, approveApplication);

// POST /api/v1/orders/:id/grant-messaging — recruiter enables direct messaging on an approved app
router.post('/:id/grant-messaging', requireAuth, requireProfileComplete, grantMessagingPermission);

// DELETE /api/v1/orders/:id/revoke-messaging — recruiter revokes messaging access
router.delete('/:id/revoke-messaging', requireAuth, requireProfileComplete, revokeMessagingPermission);

// GET /api/v1/orders/:id — requires auth + participant
router.get('/:id', requireAuth, requireProfileComplete, getOrder);

// PATCH /api/v1/orders/:id/status — requires auth + participant, validated transition
router.patch('/:id/status', requireAuth, requireProfileComplete, validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
