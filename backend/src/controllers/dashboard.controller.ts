import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

// ─── Controllers ────────────────────────────────────────────────────

/**
 * GET /dashboard/seller
 * Aggregate stats for a seller: active listings, orders by status, revenue.
 */
export async function getSellerDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sellerId = req.user!.userId;

    const [activeListings, ordersByStatus, completedOrders] = await Promise.all([
      // Count active listings
      prisma.listing.count({
        where: { sellerId, status: 'ACTIVE' },
      }),

      // Orders grouped by status
      prisma.order.groupBy({
        by: ['status'],
        where: { sellerId },
        _count: true,
      }),

      // For revenue: fetch completed orders with their listing prices
      // Prisma can't aggregate across a relation in one call,
      // so we fetch and sum in JS (fine at this scale)
      prisma.order.findMany({
        where: { sellerId, status: 'COMPLETED' },
        include: { listing: { select: { price: true } } },
      }),
    ]);

    // Sum revenue from completed orders
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + Number(order.listing.price),
      0
    );

    // Build a clean status counts object
    const statusCounts: Record<string, number> = {};
    for (const group of ordersByStatus) {
      statusCounts[group.status] = group._count;
    }

    // Get recent orders for the table view
    const recentOrders = await prisma.order.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        listing: { select: { title: true, price: true } },
        buyer: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    // Get all seller's listings for quick status toggle
    const listings = await prisma.listing.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        price: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });

    res.status(200).json({
      data: {
        stats: {
          activeListings,
          totalOrders: Object.values(statusCounts).reduce((a, b) => a + b, 0),
          pendingOrders: statusCounts['PENDING'] || 0,
          completedOrders: statusCounts['COMPLETED'] || 0,
          totalRevenue,
          ordersByStatus: statusCounts,
        },
        recentOrders,
        listings,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /dashboard/buyer
 * Aggregate stats for a buyer: order counts grouped by status.
 */
export async function getBuyerDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const buyerId = req.user!.userId;

    const [ordersByStatus, recentOrders] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where: { buyerId },
        _count: true,
      }),

      prisma.order.findMany({
        where: { buyerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          listing: { select: { title: true, price: true, category: true } },
          seller: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const group of ordersByStatus) {
      statusCounts[group.status] = group._count;
    }

    res.status(200).json({
      data: {
        stats: {
          totalOrders: Object.values(statusCounts).reduce((a, b) => a + b, 0),
          pendingOrders: statusCounts['PENDING'] || 0,
          activeOrders: (statusCounts['ACCEPTED'] || 0) + (statusCounts['IN_PROGRESS'] || 0),
          completedOrders: statusCounts['COMPLETED'] || 0,
          ordersByStatus: statusCounts,
        },
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
}
