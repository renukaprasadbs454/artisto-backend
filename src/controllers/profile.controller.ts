import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { uploadToStorage } from '../services/storage.service';
import { signAccessToken } from '../services/auth.service';

// ─── Validation Schemas ─────────────────────────────────────────────

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().refine((val) => {
    if (!val) return true;
    const wordCount = val.trim().split(/\s+/).filter(Boolean).length;
    return wordCount <= 350;
  }, { message: 'Bio cannot exceed 350 words' }).optional(),
  headline: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  skills: z.array(z.string()).max(20).optional(),
  bannerUrl: z.string().optional(),
}).strict(); // Reject unknown fields — belt and suspenders

// ─── Controllers ────────────────────────────────────────────────────

/**
 * GET /profiles/:userId
 * Public — anyone can view any user's profile.
 */
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId as string;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Profile not found' },
      });
      return;
    }

    res.status(200).json({ data: profile });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /profiles/me
 * Update the authenticated user's own profile.
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const profile = await prisma.profile.update({
      where: { userId },
      data: req.body,
    });

    res.status(200).json({ data: profile });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /profiles/me/avatar
 * Upload a new avatar to S3, update Profile.avatarUrl, and track in Media.
 */
export async function uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' },
      });
      return;
    }

    const { url, key } = await uploadToStorage(req.file, 'avatars');

    // Both writes in one transaction: Media insert + Profile update
    const [, profile] = await prisma.$transaction([
      prisma.media.create({
        data: {
          ownerId: userId,
          ownerType: 'AVATAR',
          url,
          s3Key: key,
        },
      }),
      prisma.profile.update({
        where: { userId },
        data: { avatarUrl: url },
      }),
    ]);

    res.status(200).json({ data: { avatarUrl: profile.avatarUrl } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /profiles/me/banner
 * Upload a new banner image to S3 and update Profile.bannerUrl.
 */
export async function uploadBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' },
      });
      return;
    }

    const { url, key } = await uploadToStorage(req.file, 'banners');

    const [, profile] = await prisma.$transaction([
      prisma.media.create({
        data: {
          ownerId: userId,
          ownerType: 'AVATAR',
          url,
          s3Key: key,
        },
      }),
      prisma.profile.update({
        where: { userId },
        data: { bannerUrl: url },
      }),
    ]);

    res.status(200).json({ data: { bannerUrl: profile.bannerUrl } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /profiles/u/:username
 * Public — anyone can view any user's profile by username.
 */
export async function getProfileByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const username = req.params.username as string;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
      },
    });

    if (!user || !user.profile) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Profile not found' },
      });
      return;
    }

    const { passwordHash: _, refreshTokenHash: __, profile, ...safeUser } = user;

    res.status(200).json({ data: { ...profile, user: safeUser } });
  } catch (err) {
    next(err);
  }
}

export const updateRoleSchema = z.object({
  role: z.enum(['BUYER', 'SELLER', 'ADMIN']),
});

/**
 * PATCH /profiles/role
 * Update the authenticated user's role (e.g., Become a Client).
 */
export async function updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { role } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      }
    });

    const accessToken = signAccessToken(updatedUser.id, updatedUser.role);
    res.status(200).json({ data: updatedUser, accessToken });
  } catch (err) {
    next(err);
  }
}

export const updateArtistNameSchema = z.object({
  artistName: z.string().min(3, 'Artist Name must be at least 3 characters').max(30, 'Artist Name cannot exceed 30 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Artist Name can only contain letters, numbers, underscores, and hyphens'),
});

/**
 * PATCH /profiles/artist-name
 * Update the authenticated user's Artist Name (username) with a 30-day restriction.
 */
export async function updateArtistName(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { artistName } = req.body;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, artistNameChangedAt: true, role: true },
    });

    if (!currentUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    if (currentUser.username === artistName) {
      res.status(200).json({ data: currentUser, message: 'Artist Name is unchanged' });
      return;
    }

    // Check 30 day restriction if artistNameChangedAt exists
    if (currentUser.artistNameChangedAt) {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const timeSinceLastChange = Date.now() - new Date(currentUser.artistNameChangedAt).getTime();
      if (timeSinceLastChange < thirtyDaysMs) {
        const nextChangeDate = new Date(new Date(currentUser.artistNameChangedAt).getTime() + thirtyDaysMs);
        const formattedDate = nextChangeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        res.status(400).json({
          error: {
            code: 'RENAME_RESTRICTED',
            message: `Artist Name can only be changed once every 30 days. You can change your name again after ${formattedDate}.`,
            nextChangeDate,
          },
        });
        return;
      }
    }

    // Check if new artistName is already taken
    const existing = await prisma.user.findUnique({ where: { username: artistName } });
    if (existing && existing.id !== userId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Artist Name is already taken' } });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: artistName,
        artistNameChangedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        artistNameChangedAt: true,
      },
    });

    const accessToken = signAccessToken(updatedUser.id, updatedUser.role);
    res.status(200).json({ data: updatedUser, accessToken });
  } catch (err) {
    next(err);
  }
}
