import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export const upsertExploreProfileSchema = z.object({
  availabilityStatus: z.enum(['AVAILABLE', 'BUSY', 'NOT_LOOKING']).optional(),
}).strict();

export const addFilmCreditSchema = z.object({
  tmdbMovieId: z.number().int().positive(),
  title: z.string().min(1),
  releaseYear: z.number().int().min(1900).optional(),
  posterUrl: z.string().url().optional(),
  roleName: z.string().min(1),
}).strict();

export const upsertExploreLanguageSchema = z.object({
  language: z.string().trim().min(2).max(50),
  proficiency: z.number().int().min(1).max(5),
}).strict();

/**
 * GET /explore
 * List all explore profiles with pagination and search. Public.
 */
export async function getExplores(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = req.query.q as string;
    const location = req.query.location as string;
    const skip = (page - 1) * limit;

    const availability = req.query.availability as string;

    const where: Prisma.ExploreProfileWhereInput = {};
    if (search || location) {
      const profileFilter: any = {};
      
      if (search) {
        profileFilter.OR = [
          { displayName: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (location) {
        profileFilter.location = { contains: location, mode: 'insensitive' };
      }

      where.user = { profile: { is: profileFilter } };
    }

    if (availability && ['AVAILABLE', 'BUSY', 'NOT_LOOKING'].includes(availability)) {
      where.availabilityStatus = availability as any;
    }

    const [total, explores] = await Promise.all([
      prisma.exploreProfile.count({ where }),
      prisma.exploreProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              isVerified: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  headline: true,
                  location: true,
                  skills: true,
                },
              },
            },
          },
          filmCredits: {
            take: 3, // Just include top 3 for discovery preview
            orderBy: { releaseYear: 'desc' },
          },
          languages: { orderBy: [{ proficiency: 'desc' }, { language: 'asc' }] },
        },
      }),
    ]);

    res.status(200).json({
      data: explores,
      meta: { page, limit, total },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /explore/:userId
 * Get explore profile with film credits. Public.
 */
export async function getExploreProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId as string;

    const exploreProfile = await prisma.exploreProfile.findUnique({
      where: { userId },
      include: {
        filmCredits: {
          orderBy: { releaseYear: 'desc' },
        },
        languages: { orderBy: [{ proficiency: 'desc' }, { language: 'asc' }] },
        user: {
          select: {
            id: true,
            username: true,
            isVerified: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bannerUrl: true,
                headline: true,
                location: true,
                bio: true,
              },
            },
          },
        },
      },
    });

    if (!exploreProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Explore profile not found' } });
      return;
    }

    res.status(200).json({ data: exploreProfile });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /explore/me
 * Upsert explore profile.
 */
export async function upsertExploreProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { availabilityStatus } = req.body;

    const exploreProfile = await prisma.exploreProfile.upsert({
      where: { userId },
      create: {
        userId,
        availabilityStatus,
      },
      update: {
        availabilityStatus,
      },
      include: {
        filmCredits: {
          orderBy: { releaseYear: 'desc' },
        },
        languages: { orderBy: [{ proficiency: 'desc' }, { language: 'asc' }] },
        user: {
          select: {
            id: true,
            username: true,
            isVerified: true,
            profile: {
              select: { displayName: true, avatarUrl: true, bannerUrl: true, headline: true, location: true, bio: true, skills: true },
            },
          },
        },
      },
    });

    res.status(200).json({ data: exploreProfile });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /explore/me/credits
 * Add a film credit to current user's explore profile.
 */
export async function addFilmCredit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = req.body;

    const exploreProfile = await prisma.exploreProfile.findUnique({ where: { userId } });
    if (!exploreProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'You must create an explore profile first' } });
      return;
    }

    const credit = await prisma.filmCredit.create({
      data: {
        exploreProfileId: exploreProfile.id,
        ...data,
      },
    });

    res.status(201).json({ data: credit });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /explore/me/credits/:creditId
 * Delete a film credit.
 */
export async function deleteFilmCredit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const creditId = req.params.creditId as string;

    const exploreProfile = await prisma.exploreProfile.findUnique({ where: { userId } });
    if (!exploreProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Explore profile not found' } });
      return;
    }

    const credit = await prisma.filmCredit.findUnique({ where: { id: creditId } });
    if (!credit || credit.exploreProfileId !== exploreProfile.id) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Film credit not found' } });
      return;
    }

    await prisma.filmCredit.delete({ where: { id: creditId } });

    res.status(200).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}

/** POST /explore/me/languages — add a language or update its proficiency. */
export async function upsertExploreLanguage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const exploreProfile = await prisma.exploreProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!exploreProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'You must create an explore profile first' } });
      return;
    }

    const language = req.body.language.trim();
    const savedLanguage = await prisma.exploreLanguage.upsert({
      where: { exploreProfileId_language: { exploreProfileId: exploreProfile.id, language } },
      create: { exploreProfileId: exploreProfile.id, language, proficiency: req.body.proficiency },
      update: { proficiency: req.body.proficiency },
    });

    res.status(200).json({ data: savedLanguage });
  } catch (err) {
    next(err);
  }
}

/** DELETE /explore/me/languages/:languageId */
export async function deleteExploreLanguage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const exploreProfile = await prisma.exploreProfile.findUnique({ where: { userId: req.user!.userId } });
    const languageId = req.params.languageId as string;
    const language = exploreProfile ? await prisma.exploreLanguage.findUnique({ where: { id: languageId } }) : null;
    if (!exploreProfile || !language || language.exploreProfileId !== exploreProfile.id) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Language not found' } });
      return;
    }

    await prisma.exploreLanguage.delete({ where: { id: languageId } });
    res.status(200).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /explore/u/:username
 * Get explore profile by username. Public.
 */
export async function getExploreProfileByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const username = req.params.username as string;

    let user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
      }
    });

    // Preserve public explore links after a username change.
    if (!user) {
      const previous = await prisma.previousUsername.findFirst({
        where: { username: { equals: username, mode: 'insensitive' } },
        select: { userId: true },
      });
      if (previous) user = await prisma.user.findUnique({ where: { id: previous.userId }, select: { id: true } });
    }

    if (!user) {
      res.status(404).json({ error: { message: 'User not found' } });
      return;
    }

    const exploreProfile = await prisma.exploreProfile.findUnique({
      where: { userId: user.id },
      include: {
        filmCredits: {
          orderBy: { releaseYear: 'desc' },
        },
        languages: { orderBy: [{ proficiency: 'desc' }, { language: 'asc' }] },
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            isVerified: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bannerUrl: true,
                headline: true,
                bio: true,
                location: true,
                skills: true,
              },
            },
          },
        },
      },
    });

    if (!exploreProfile) {
      res.status(404).json({ error: { message: 'Explore profile not found' } });
      return;
    }

    res.status(200).json({ data: exploreProfile });
  } catch (err) {
    next(err);
  }
}