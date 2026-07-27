import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { ALLOWED_TRANSITIONS, TRANSITION_AUTHORIZATION, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '../utils/constants';

// ─── Validation Schemas ─────────────────────────────────────────────

export const createOrderSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID').optional(),
  openingId: z.string().uuid('Invalid opening ID').optional(),
  requirements: z.string().max(5000).optional(),
  portfolioUrl: z.string().url('Invalid portfolio URL format').or(z.string().length(0)).optional(),
}).refine(data => data.listingId || data.openingId, {
  message: 'Either listingId or openingId is required',
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED',
  ]),
});

// ─── Controllers ────────────────────────────────────────────────────

/**
 * POST /orders
 * Place an order / apply for a listing OR recruiter opening.
 */
export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { listingId, openingId, requirements, portfolioUrl } = req.body;
    const buyerId = req.user!.userId;

    let sellerId = '';
    let itemTitle = '';

    if (openingId) {
      const opening = await prisma.recruiterOpening.findUnique({
        where: { id: openingId },
        include: { company: { include: { page: true } } },
      });

      if (!opening) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Recruiter role opening not found' },
        });
        return;
      }

      if (!opening.isOpen || !opening.company.isRecruitmentOpen) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Recruitment for this role is currently closed' },
        });
        return;
      }

      if (opening.company.page.ownerId === buyerId) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'You cannot apply to your own recruiter opening' },
        });
        return;
      }

      sellerId = opening.company.page.ownerId;
      itemTitle = `${opening.title} at ${opening.company.name}`;
    } else if (listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });

      if (!listing) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Listing not found' },
        });
        return;
      }

      if (listing.status !== 'ACTIVE') {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Listing is not active' },
        });
        return;
      }

      if (listing.sellerId === buyerId) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'You cannot order your own listing' },
        });
        return;
      }

      sellerId = listing.sellerId;
      itemTitle = listing.title;
    }

    // Create Order + Conversation atomically
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newOrder = await tx.order.create({
        data: {
          listingId: listingId || null,
          openingId: openingId || null,
          buyerId,
          sellerId,
          requirements,
          portfolioUrl: portfolioUrl || null,
        },
      });

      // Auto-create conversation
      const conversation = await tx.conversation.create({
        data: {
          orderId: newOrder.id,
          participantOneId: buyerId,
          participantTwoId: sellerId,
        },
      });

      // Send initial application notification message
      const pitchText = requirements ? `\n\nPitch/Details:\n${requirements}` : '';
      const workLinkText = portfolioUrl ? `\n\nPortfolio/Work Link:\n${portfolioUrl}` : '';

      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: buyerId,
          content: `📥 New Job Application submitted for "${itemTitle}".${pitchText}${workLinkText}`,
        },
      });

      return newOrder;
    });

    res.status(201).json({ data: order });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /orders
 * List orders for the authenticated user (either as buyer or seller).
 */
export async function getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.query.role as string | undefined;

    const page = Math.max(1, parseInt(req.query.page as string || '1', 10) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string || '10', 10) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = role === 'seller'
      ? { sellerId: userId }
      : role === 'buyer'
        ? { buyerId: userId }
        : { OR: [{ buyerId: userId }, { sellerId: userId }] };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: { select: { title: true, price: true, category: true } },
          opening: { select: { title: true, roleCategory: true, company: { select: { name: true } } } },
          buyer: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          seller: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      data: orders,
      meta: { page, limit, total },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /orders/:id
 * Get a single order — only accessible by the buyer or seller on that order.
 */
export async function getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        listing: { select: { title: true, price: true, category: true, deliveryDays: true } },
        opening: { select: { title: true, roleCategory: true, company: { select: { name: true } } } },
        buyer: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        seller: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        conversation: { select: { id: true } },
      },
    });

    if (!order) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
      return;
    }

    // Only the buyer or seller on this order may view it
    const userId = req.user!.userId;
    if (order.buyerId !== userId && order.sellerId !== userId) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You are not a participant of this order' },
      });
      return;
    }

    res.status(200).json({ data: order });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /orders/:id/status
 * Advance an order's status — validates the transition and who can trigger it.
 */
export async function updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status: newStatus } = req.body as { status: OrderStatus };
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
      return;
    }

    // Check participant
    if (order.buyerId !== userId && order.sellerId !== userId) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You are not a participant of this order' },
      });
      return;
    }

    // Check valid transition
    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: `Cannot transition from ${order.status} to ${newStatus}`,
        },
      });
      return;
    }

    // Check who can trigger this specific transition
    const transitionKey = `${order.status}->${newStatus}`;
    const authorizedSide = TRANSITION_AUTHORIZATION[transitionKey];

    if (authorizedSide) {
      const isBuyer = order.buyerId === userId;
      const isSeller = order.sellerId === userId;

      if (authorizedSide === 'buyer' && !isBuyer) {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Only the buyer can perform this action' },
        });
        return;
      }

      if (authorizedSide === 'seller' && !isSeller) {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Only the seller can perform this action' },
        });
        return;
      }

      // 'both' — either side is fine, and we already checked they're a participant
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus },
      include: {
        listing: { select: { title: true, price: true } },
        buyer: { select: { id: true, profile: { select: { displayName: true } } } },
        seller: { select: { id: true, profile: { select: { displayName: true } } } },
      },
    });

    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
}
