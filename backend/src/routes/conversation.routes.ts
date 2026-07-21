import { Router } from 'express';
import { requireAuth, requireProfileComplete } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getConversations,
  createConversation,
  getMessages,
  createConversationSchema,
} from '../controllers/conversation.controller';

const router = Router();

// GET /api/v1/conversations — requires auth
router.get('/', requireAuth, requireProfileComplete, getConversations);

// POST /api/v1/conversations — requires auth, body: { orderId }
router.post('/', requireAuth, requireProfileComplete, validate(createConversationSchema), createConversation);

// GET /api/v1/conversations/:id/messages — requires auth + participant
router.get('/:id/messages', requireAuth, requireProfileComplete, getMessages);

export default router;
