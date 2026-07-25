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
} from '../controllers/order.controller';

const router = Router();

// POST /api/v1/orders — requires auth
router.post('/', requireAuth, requireProfileComplete, validate(createOrderSchema), createOrder);

// GET /api/v1/orders — requires auth (returns current user's orders)
router.get('/', requireAuth, requireProfileComplete, getOrders);

// GET /api/v1/orders/:id — requires auth + participant
router.get('/:id', requireAuth, requireProfileComplete, getOrder);

// PATCH /api/v1/orders/:id/status — requires auth + participant, validated transition
router.patch('/:id/status', requireAuth, requireProfileComplete, validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
