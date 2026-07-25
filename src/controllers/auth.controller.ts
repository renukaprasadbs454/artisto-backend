import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  generateRefreshToken,
  parseRefreshCookie,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from '../services/auth.service';
import { isProfileComplete } from '../utils/profile';
import { Prisma } from '@prisma/client';

// ─── Validation Schemas ─────────────────────────────────────────────

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1, 'Display name is required').max(100),
  role: z.enum(['BUYER', 'SELLER']).optional().default('SELLER'), // Default to SELLER (Creator)
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Controllers ────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Create a new user + profile in one transaction, then issue tokens.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password, displayName, role } = req.body;

    // Check email or username uniqueness
    const existing = await prisma.user.findFirst({ 
      where: { 
        OR: [
          { email },
          { username }
        ]
      } 
    });
    if (existing) {
      res.status(409).json({
        error: { code: 'CONFLICT', message: 'Email or username is already registered' },
      });
      return;
    }

    const passwordHash = await hashPassword(password);

    // Create user + profile atomically — a user without a profile
    // is a state we don't want to handle everywhere else
    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
          role: role || 'SELLER',
          profile: {
            create: { displayName },
          },
          actorProfile: {
            create: { availabilityStatus: 'AVAILABLE' }
          }
        },
        include: { profile: true },
      });
      return newUser;
    });

    // Issue tokens
    const accessToken = signAccessToken(user.id, user.role);
    const { cookieValue, hash } = await generateRefreshToken(user.id);

    // Store refresh token hash
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hash },
    });

    setRefreshCookie(res, cookieValue);

    // Never return passwordHash
    const { passwordHash: _, refreshTokenHash: __, ...safeUser } = user;

    res.status(201).json({
      data: {
        user: safeUser,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/login
 * Authenticate with email + password, issue tokens.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    // Same error for "no such email" and "wrong password" — don't leak which one
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Invalid email or password' },
      });
      return;
    }

    const accessToken = signAccessToken(user.id, user.role);
    const { cookieValue, hash } = await generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hash },
    });

    setRefreshCookie(res, cookieValue);

    const { passwordHash: _, refreshTokenHash: __, ...safeUser } = user;

    res.status(200).json({
      data: {
        user: safeUser,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/refresh
 * Rotate refresh token and issue new access token.
 * Refresh token is read from the httpOnly cookie.
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookie = req.cookies?.refreshToken;

    if (!cookie) {
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'No refresh token' },
      });
      return;
    }

    const parsed = parseRefreshCookie(cookie);
    if (!parsed) {
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Invalid refresh token format' },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
    });

    if (!user || !user.refreshTokenHash) {
      clearRefreshCookie(res);
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Invalid refresh token' },
      });
      return;
    }

    const valid = await verifyRefreshToken(parsed.rawToken, user.refreshTokenHash);
    if (!valid) {
      // Possible token reuse — clear it
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null },
      });
      clearRefreshCookie(res);
      res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Invalid refresh token' },
      });
      return;
    }

    // Rotate: issue a new pair
    const accessToken = signAccessToken(user.id, user.role);
    const { cookieValue, hash } = await generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hash },
    });

    setRefreshCookie(res, cookieValue);

    res.status(200).json({
      data: { accessToken },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/logout
 * Clear the refresh cookie and null out refreshTokenHash.
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookie = req.cookies?.refreshToken;

    if (cookie) {
      const parsed = parseRefreshCookie(cookie);
      if (parsed) {
        await prisma.user.update({
          where: { id: parsed.userId },
          data: { refreshTokenHash: null },
        }).catch(() => {
          // User might not exist — that's fine, just clear the cookie
        });
      }
    }

    clearRefreshCookie(res);
    res.status(200).json({ data: { message: 'Logged out' } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /auth/me
 * Return the authenticated user + profile (minus passwordHash).
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { profile: true },
    });

    if (!user) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const { passwordHash: _, refreshTokenHash: __, ...safeUser } = user;

    const profileComplete = isProfileComplete(user.profile);

    res.status(200).json({ data: { ...safeUser, profileComplete } });
  } catch (err) {
    next(err);
  }
}
