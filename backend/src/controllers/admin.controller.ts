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

/**
 * GET /admin/tables/:tableName
 * Admin Table Editor — fetch records from any database table.
 */
export async function getTableRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tableName = req.params.tableName as string;
    let data: any[] = [];

    switch (tableName) {
      case 'users':
        data = await prisma.user.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
          select: { id: true, username: true, email: true, role: true, suspended: true, createdAt: true },
        });
        break;
      case 'profiles':
        data = await prisma.profile.findMany({
          take: 100,
          select: { id: true, userId: true, displayName: true, headline: true, location: true, updatedAt: true },
        });
        break;
      case 'actor_profiles':
        data = await prisma.actorProfile.findMany({
          take: 100,
          include: {
            user: { select: { username: true, email: true } },
            filmCredits: { select: { title: true, roleName: true, releaseYear: true } },
          },
        });
        break;
      case 'listings':
        data = await prisma.listing.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: {
            seller: { select: { username: true, email: true } },
          },
        });
        break;
      case 'orders':
        data = await prisma.order.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: {
            buyer: { select: { username: true } },
            seller: { select: { username: true } },
            listing: { select: { title: true, price: true } },
          },
        });
        break;
      case 'payments':
        data = await prisma.payment.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { username: true, email: true } },
          },
        });
        break;
      case 'posts':
        data = await prisma.post.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { username: true } },
          },
        });
        break;
      default:
        res.status(400).json({ error: { code: 'INVALID_TABLE', message: `Table '${tableName}' not found or unsupported` } });
        return;
    }

    res.status(200).json({ data, tableName });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/tables/:tableName/:id
 * Admin Table Editor — delete a record from a table.
 */
export async function deleteTableRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tableName, id } = req.params;

    switch (tableName) {
      case 'users':
        await prisma.user.delete({ where: { id } });
        break;
      case 'listings':
        await prisma.listing.delete({ where: { id } });
        break;
      case 'orders':
        await prisma.order.delete({ where: { id } });
        break;
      case 'posts':
        await prisma.post.delete({ where: { id } });
        break;
      case 'payments':
        await prisma.payment.delete({ where: { id } });
        break;
      default:
        res.status(400).json({ error: { code: 'INVALID_TABLE', message: `Cannot delete record from table '${tableName}'` } });
        return;
    }

    res.status(200).json({ data: { success: true, message: `Record deleted from ${tableName}` } });
  } catch (err) {
    next(err);
  }
}
