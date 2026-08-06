import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword } from '../services/auth.service';

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
    if (targetUser.id === req.user!.userId) {
      res.status(400).json({ error: { code: 'ADMIN_SELF_ACTION_DENIED', message: 'Administrators cannot suspend their own account.' } });
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
 * PATCH /admin/users/:userId/role
 * Update another user's role (ADMIN only)
 */
export async function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const identifier = req.params.userId as string;
    const { role } = req.body;

    if (!role || !['BUYER', 'SELLER', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'role must be BUYER, SELLER or ADMIN' } });
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
    if (targetUser.id === req.user!.userId) {
      res.status(400).json({ error: { code: 'ADMIN_SELF_ACTION_DENIED', message: 'Administrators cannot change their own role.' } });
      return;
    }

    const user = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role },
      select: { id: true, username: true, email: true, role: true },
    });

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /admin/users/:userId/password
 * Set a new password for another user (ADMIN only)
 */
export async function updateUserPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const identifier = req.params.userId as string;
    const { password } = req.body;

    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'password must be at least 8 characters' } });
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

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        passwordHash,
        mustResetPassword: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        mustResetPassword: true,
      },
    });

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/users
 * Create a new user (ADMIN only)
 */
export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password, displayName, role } = req.body;
    if (!username || !email || !password || !displayName) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'username, email, password and displayName are required' } });
      return;
    }

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existing) {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'Email or username already exists' } });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
          role: role || 'SELLER',
          profile: { create: { displayName } },
        },
        include: { profile: true },
      });
      return u;
    });

    const { passwordHash: _, refreshTokenHash: __, ...safeUser } = user as any;
    res.status(201).json({ data: safeUser });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /admin/users/:userId/force-password-reset
 * Mark a user as required to reset their password on next login.
 */
export async function forcePasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const identifier = req.params.userId as string;
    const { mustReset } = req.body;

    if (typeof mustReset !== 'boolean') {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'mustReset must be a boolean' } });
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

    if (targetUser.role === 'ADMIN' && mustReset) {
      res.status(400).json({ error: { code: 'ADMIN_PASSWORD_RESET_DISABLED', message: 'Administrator accounts cannot be forced through the password recovery flow.' } });
      return;
    }

    const user = await prisma.user.update({
      where: { id: targetUser.id },
      data: { mustResetPassword: mustReset },
      select: { id: true, username: true, email: true, mustResetPassword: true },
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
        data = await (prisma as any).exploreProfile.findMany({
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
      case 'subscriptions':
        data = await prisma.subscription.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { username: true, email: true } },
            _count: { select: { payments: true } },
          } as any,
        });
        break;
      case 'recruitments':
        data = await prisma.companyOpening.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: {
                name: true,
                owner: { select: { username: true } },
              },
            },
            _count: { select: { applications: true } },
          } as any,
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
    const tableName = req.params.tableName as string;
    const id = req.params.id as string;

    switch (tableName) {
      case 'users':
        await prisma.$transaction([
          prisma.postLike.deleteMany({ where: { userId: id } }),
          prisma.postComment.deleteMany({ where: { userId: id } }),
          prisma.post.deleteMany({ where: { authorId: id } }),
          prisma.message.deleteMany({ where: { senderId: id } }),
          prisma.conversation.deleteMany({ where: { OR: [{ participantOneId: id }, { participantTwoId: id }] } }),
          prisma.order.deleteMany({ where: { OR: [{ buyerId: id }, { sellerId: id }] } }),
          prisma.listing.deleteMany({ where: { sellerId: id } }),
          prisma.media.deleteMany({ where: { ownerId: id } }),
          prisma.portfolioItem.deleteMany({ where: { userId: id } }),
          prisma.workExperience.deleteMany({ where: { userId: id } }),
          (prisma as any).exploreProfile.deleteMany({ where: { userId: id } }),
          prisma.profile.deleteMany({ where: { userId: id } }),
          prisma.user.delete({ where: { id } }),
        ]);
        break;
      case 'profiles':
        await prisma.profile.delete({ where: { id } });
        break;
      case 'actor_profiles':
        await (prisma as any).exploreProfile.delete({ where: { id } });
        break;
      case 'listings':
        await prisma.$transaction([
          prisma.order.deleteMany({ where: { listingId: id } }),
          prisma.listing.delete({ where: { id } }),
        ]);
        break;
      case 'orders':
        await prisma.$transaction([
          prisma.message.deleteMany({ where: { conversation: { orderId: id } } }),
          prisma.conversation.deleteMany({ where: { orderId: id } }),
          prisma.order.delete({ where: { id } }),
        ]);
        break;
      case 'posts':
        await prisma.$transaction([
          prisma.postLike.deleteMany({ where: { postId: id } }),
          prisma.postComment.deleteMany({ where: { postId: id } }),
          prisma.post.delete({ where: { id } }),
        ]);
        break;
      case 'payments':
        await prisma.payment.delete({ where: { id } });
        break;
      case 'subscriptions':
        await prisma.subscription.delete({ where: { id } });
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

/**
 * PATCH /admin/subscriptions/:id/toggle
 * Toggle subscription status between ACTIVE and CANCELLED (admin action)
 */
export async function toggleSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Subscription not found' } }); return; }
    const newStatus = sub.status === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE';
    const updated = await prisma.subscription.update({ where: { id }, data: { status: newStatus } });
    res.status(200).json({ data: updated });
  } catch (err) { next(err); }
}

/**
 * POST /admin/payments/:id/reconcile
 * Mark a payment as CAPTURED (reconciled) if possible.
 */
export async function reconcilePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Payment not found' } }); return; }
    if (payment.status === 'CAPTURED') { res.status(200).json({ data: payment }); return; }
    const updated = await prisma.payment.update({ where: { id }, data: { status: 'CAPTURED' } });
    res.status(200).json({ data: updated });
  } catch (err) { next(err); }
}

/**
 * PATCH /admin/subscriptions/:id
 * Update subscription fields (plan, status, expiresAt)
 */
 export async function updateSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
   try {
     const id = req.params.id as string;
     const payload: any = {};
     if (typeof req.body.plan === 'string') payload.plan = req.body.plan;
     if (typeof req.body.status === 'string') payload.status = req.body.status;
     if (req.body.expiresAt) payload.currentPeriodEnd = new Date(String(req.body.expiresAt));
     const updated = await prisma.subscription.update({ where: { id }, data: payload });
     res.status(200).json({ data: updated });
  } catch (err) { next(err); }
}

/**
 * PATCH /admin/payments/:id
 * Update payment fields (utr, status, amount)
 */
export async function updatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const payload: any = {};
    if (typeof req.body.utr === 'string') payload.utr = req.body.utr;
    if (typeof req.body.status === 'string') payload.status = req.body.status;
    if (typeof req.body.amount !== 'undefined') payload.amount = Number(req.body.amount);
    const updated = await prisma.payment.update({ where: { id }, data: payload });
    res.status(200).json({ data: updated });
  } catch (err) { next(err); }
}

/**
 * PATCH /admin/recruitments/:id
 * Update a company opening (title, description, isOpen, salary)
 */
export async function updateRecruitment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const payload: any = {};
    if (typeof req.body.title === 'string') payload.title = req.body.title;
    if (typeof req.body.description === 'string') payload.description = req.body.description;
    if (typeof req.body.isOpen === 'boolean') payload.isOpen = req.body.isOpen;
    if (typeof req.body.salary === 'string') payload.salary = req.body.salary;
    const updated = await prisma.companyOpening.update({ where: { id }, data: payload });
    res.status(200).json({ data: updated });
  } catch (err) { next(err); }
}
