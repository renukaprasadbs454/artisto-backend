import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { isProfileComplete } from '../utils/profile';

/**
 * Verify the JWT access token from the Authorization header.
 * Attaches { userId, role } to req.user on success.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Missing token' },
    });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      userId: string;
      role: string;
    };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' },
    });
  }
}

/**
 * Check that the authenticated user has one of the required roles.
 * Must be used after requireAuth.
 */
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient role' },
      });
      return;
    }

    if (roles.includes(req.user.role)) {
      next();
      return;
    }

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });

      if (dbUser && roles.includes(dbUser.role)) {
        req.user.role = dbUser.role;
        next();
        return;
      }
    } catch (e) {
      // Ignore DB query errors and fail role check
    }

    res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Insufficient role' },
    });
  };
}

/**
 * Require the authenticated user's profile to be complete.
 * Must be used after requireAuth.
 */
export async function requireProfileComplete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!isProfileComplete(profile)) {
      res.status(403).json({
        error: { code: 'PROFILE_INCOMPLETE', message: 'Complete your profile to continue' },
      });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}
