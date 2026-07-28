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
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[^A-Za-z0-9])/, 'Password must contain at least one special character'),
  displayName: z.string().min(1, 'Display name is required').max(100),
  role: z.enum(['BUYER', 'SELLER']).optional().default('SELLER'), // Default to SELLER (Creator)
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[^A-Za-z0-9])/, 'Password must contain at least one special character'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: resetPasswordSchema.shape.password,
});

// ─── Controllers ────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Create a new user + profile in one transaction, then issue tokens.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      res.status(400).json({ error: { code: 'INVALID_INPUT', message } });
      return;
    }

    const { username, email, password, displayName, role } = parsed.data;

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
 * POST /auth/reset-password
 * Authenticated endpoint to set a new password when required.
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      res.status(400).json({ error: { code: 'INVALID_INPUT', message } });
      return;
    }

    const { password } = parsed.data;
    const userId = req.user!.userId;

    const passwordHash = await hashPassword(password);

    // Update password and clear mustResetPassword, rotate refresh token and issue new access token
    const { cookieValue, hash } = await generateRefreshToken(userId);
    const accessToken = signAccessToken(userId, req.user!.role);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustResetPassword: false, refreshTokenHash: hash },
      include: { profile: true },
    });

    setRefreshCookie(res, cookieValue);

    const { passwordHash: _, refreshTokenHash: __, ...safeUser } = user as any;

    res.status(200).json({ data: { user: safeUser, accessToken } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/change-password
 * Change an existing password after verifying the user's current password.
 */
export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      res.status(400).json({ error: { code: 'INVALID_INPUT', message } });
      return;
    }

    const { currentPassword, newPassword } = parsed.data;
    if (currentPassword === newPassword) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'New password must be different from your current password' } });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
      res.status(400).json({ error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect' } });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword), mustResetPassword: false },
    });

    res.status(200).json({ data: { message: 'Password changed successfully' } });
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
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
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

    const mustReset = Boolean((user as any).mustResetPassword);
    const responseData: any = { user: safeUser, accessToken };
    if (mustReset) {
      responseData.mustResetPassword = true;
      responseData.message = 'Password reset required. Please update your password.';
    }

    res.status(200).json({ data: responseData });
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
 * GET /auth/username-suggestions?username=base
 * Return a list of available username suggestions based on the provided base.
 */
export async function usernameSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const base = (req.query.username as string || '').trim();
    if (!base || base.length < 2) {
      res.status(200).json({ data: [] });
      return;
    }

    const normalized = base.replace(/\s+/g, '').toLowerCase().replace(/[^a-z0-9_-]/g, '');

    // Use only the requested tokens and include numeric / underscore variants
    const tokens = ['official', 'officials', 'arts', 'studio', 'actor'];

    const candidates: string[] = [];
    // base
    candidates.push(normalized);

    // generate variants using requested tokens
    for (const t of tokens) {
      candidates.push(`${normalized}${t}`);
      candidates.push(`${normalized}_${t}`);
      candidates.push(`${t}${normalized}`);
      candidates.push(`${t}_${normalized}`);
      if (candidates.length > 60) break;
    }

    // numeric suffixes and underscore numeric variants
    for (let i = 1; candidates.length < 120 && i <= 200; i++) {
      candidates.push(`${normalized}${i}`);
      candidates.push(`${normalized}_${i}`);
    }

    const suggestions: string[] = [];
    for (const c of candidates) {
      // check availability case-insensitively
      // eslint-disable-next-line no-await-in-loop
      const exists = await prisma.user.findFirst({ where: { username: { equals: c, mode: 'insensitive' } } });
      if (!exists && !suggestions.includes(c)) {
        suggestions.push(c);
      }
      if (suggestions.length >= 6) break;
    }

    res.status(200).json({ data: suggestions });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /auth/check-username?username=foo[&excludeSelf=true]
 * Public (no auth) when excludeSelf is absent/false. When excludeSelf=true,
 * requires authentication (requireAuth in route registration), and a match
 * against the caller's own username is treated as "available".
 * Normalizes input: trims + lowercases.
 * Returns data: { username: string, available: boolean, valid: boolean }
 *   valid:     whether the input matches the registration username regex (length, chars)
 *   available: true if no other user owns this username (case-insensitive).
 *              False if taken OR invalid.
 */
export async function checkUsernameAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = (req.query.username as string || '').trim();
    const username = raw.toLowerCase();
    const excludeSelf = String(req.query.excludeSelf || '').toLowerCase() === 'true';
    const selfUserId = excludeSelf && req.user ? req.user.userId : undefined;

    if (!username) {
      res.status(200).json({ data: { username: raw, available: false, valid: false } });
      return;
    }

    const validChars = /^[a-z0-9_-]{3,20}$/.test(username);

    const exists = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: { id: true },
    });

    const isTaken = !!exists && exists.id !== selfUserId;

    res.status(200).json({
      data: {
        username,
        valid: validChars,
        available: validChars && !isTaken,
      },
    });
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
