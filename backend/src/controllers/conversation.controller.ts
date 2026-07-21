import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '../utils/constants';

// ─── Validation Schemas ─────────────────────────────────────────────

export const createConversationSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
});

// ─── Controllers ────────────────────────────────────────────────────

/**
 * GET /conversations
 * List all conversations for the authenticated user, with unread counts.
 */
export async function getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participantOneId: userId },
          { participantTwoId: userId },
        ],
      },
      include: {
        participantOne: {
          select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } },
        },
        participantTwo: {
          select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } },
        },
        order: {
          select: { id: true, status: true, listing: { select: { title: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (convo) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: convo.id,
            senderId: { not: userId },
            readAt: null,
          },
        });

        return {
          ...convo,
          lastMessage: convo.messages[0] || null,
          messages: undefined, // Don't send the messages array
          unreadCount,
        };
      })
    );

    res.status(200).json({ data: conversationsWithUnread });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /conversations
 * Find or create a conversation for a given orderId.
 */
export async function createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { orderId } = req.body;
    const userId = req.user!.userId;

    // Verify the order exists and the user is a participant
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
      return;
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You are not a participant of this order' },
      });
      return;
    }

    // Find existing conversation for this order, or create one
    let conversation = await prisma.conversation.findUnique({
      where: { orderId },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          orderId,
          participantOneId: order.buyerId,
          participantTwoId: order.sellerId,
        },
      });
    }

    res.status(200).json({ data: conversation });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /conversations/:id/messages
 * Get paginated messages for a conversation — participant only.
 */
export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversationId = req.params.id as string;
    const userId = req.user!.userId;
    const page = Math.max(1, parseInt(req.query.page as string) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    // Verify the user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Conversation not found' },
      });
      return;
    }

    if (conversation.participantOneId !== userId && conversation.participantTwoId !== userId) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You are not a participant of this conversation' },
      });
      return;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // Most recent first, client can reverse
        include: {
          sender: {
            select: {
              id: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    res.status(200).json({
      data: messages,
      meta: { page, limit, total },
    });
  } catch (err) {
    next(err);
  }
}
