import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

/**
 * GET /admin/stats
 * Get platform statistics (users, subscriptions, revenue).
 */
export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalUsers,
      totalOrders,
      activeSubscriptions,
      successfulPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'CAPTURED' },
      }),
    ]);

    const revenue = (successfulPayments._sum?.amount || 0) / 100; // Assuming stored in smallest unit if INR

    res.status(200).json({
      data: {
        totalUsers,
        totalOrders,
        activeSubscriptions,
        revenue,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /admin/users/:userId/suspend
 * Suspend or unsuspend a user.
 */
export async function toggleSuspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const identifier = req.params.userId as string;
    const { suspended } = req.body;

    if (typeof suspended !== 'boolean') {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'suspended must be a boolean' } });
      return;
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { username: identifier },
          { email: identifier },
        ],
      },
    });

    if (!targetUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: `User "${identifier}" not found` } });
      return;
    }

    const user = await prisma.user.update({
      where: { id: targetUser.id },
      data: { suspended },
      select: { id: true, username: true, email: true, suspended: true },
    });

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}
