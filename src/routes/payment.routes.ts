import { Router } from 'express';
import { requireAuth, requireProfileComplete } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createOrder,
  verifyOrder,
  createOrderSchema,
  verifyOrderSchema,
} from '../controllers/payment.controller';

const router = Router();

router.post(
  '/create-order',
  requireAuth,
  requireProfileComplete,
  validate(createOrderSchema),
  createOrder
);

router.post(
  '/verify',
  requireAuth,
  requireProfileComplete,
  validate(verifyOrderSchema),
  verifyOrder
);

export default router;
