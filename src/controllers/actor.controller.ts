import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export const upsertActorProfileSchema = z.object({
  availabilityStatus: z.enum(['AVAILABLE', 'BUSY', 'NOT_LOOKING']).optional(),
}).strict();

export const addFilmCreditSchema = z.object({
  tmdbMovieId: z.number().int().positive(),
  title: z.string().min(1),
  releaseYear: z.number().int().min(1900).optional(),
  posterUrl: z.string().url().optional(),
  roleName: z.string().min(1),
}).strict();

export const upsertActorLanguageSchema = z.object({
  language: z.string().trim().min(2).max(50),
  proficiency: z.number().int().min(1).max(5),
}).strict();

/**
 * GET /actor
 * List all actor profiles with pagination and search. Public.
 */
export async function getActors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = req.query.q as string;
    const location = req.query.location as string;
    const skip = (page - 1) * limit;

    const availability = req.query.availability as string;

    const where: Prisma.ActorProfileWhereInput = {};
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

    const [total, actors] = await Promise.all([
      prisma.actorProfile.count({ where }),
      prisma.actorProfile.findMany({
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
      data: actors,
      meta: { page, limit, total },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /actor/:userId
 * Get actor profile with film credits. Public.
 */
export async function getActorProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId as string;

    const actorProfile = await prisma.actorProfile.findUnique({
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

    if (!actorProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Actor profile not found' } });
      return;
    }

    res.status(200).json({ data: actorProfile });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /actor/me
 * Upsert actor profile.
 */
export async function upsertActorProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { availabilityStatus } = req.body;

    const actorProfile = await prisma.actorProfile.upsert({
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

    res.status(200).json({ data: actorProfile });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /actor/me/credits
 * Add a film credit to current user's actor profile.
 */
export async function addFilmCredit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = req.body;

    const actorProfile = await prisma.actorProfile.findUnique({ where: { userId } });
    if (!actorProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'You must create an actor profile first' } });
      return;
    }

    const credit = await prisma.filmCredit.create({
      data: {
        actorProfileId: actorProfile.id,
        ...data,
      },
    });

    res.status(201).json({ data: credit });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /actor/me/credits/:creditId
 * Delete a film credit.
 */
export async function deleteFilmCredit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const creditId = req.params.creditId as string;

    const actorProfile = await prisma.actorProfile.findUnique({ where: { userId } });
    if (!actorProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Actor profile not found' } });
      return;
    }

    const credit = await prisma.filmCredit.findUnique({ where: { id: creditId } });
    if (!credit || credit.actorProfileId !== actorProfile.id) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Film credit not found' } });
      return;
    }

    await prisma.filmCredit.delete({ where: { id: creditId } });

    res.status(200).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}

/** POST /actor/me/languages — add a language or update its proficiency. */
export async function upsertActorLanguage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actorProfile = await prisma.actorProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!actorProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'You must create an actor profile first' } });
      return;
    }

    const language = req.body.language.trim();
    const savedLanguage = await prisma.actorLanguage.upsert({
      where: { actorProfileId_language: { actorProfileId: actorProfile.id, language } },
      create: { actorProfileId: actorProfile.id, language, proficiency: req.body.proficiency },
      update: { proficiency: req.body.proficiency },
    });

    res.status(200).json({ data: savedLanguage });
  } catch (err) {
    next(err);
  }
}

/** DELETE /actor/me/languages/:languageId */
export async function deleteActorLanguage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actorProfile = await prisma.actorProfile.findUnique({ where: { userId: req.user!.userId } });
    const languageId = req.params.languageId as string;
    const language = actorProfile ? await prisma.actorLanguage.findUnique({ where: { id: languageId } }) : null;
    if (!actorProfile || !language || language.actorProfileId !== actorProfile.id) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Language not found' } });
      return;
    }

    await prisma.actorLanguage.delete({ where: { id: languageId } });
    res.status(200).json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /actor/u/:username
 * Get actor profile by username. Public.
 */
export async function getActorProfileByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const username = req.params.username as string;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
      }
    });

    if (!user) {
      res.status(404).json({ error: { message: 'User not found' } });
      return;
    }

    const actorProfile = await prisma.actorProfile.findUnique({
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

    if (!actorProfile) {
      res.status(404).json({ error: { message: 'Actor profile not found' } });
      return;
    }

    res.status(200).json({ data: actorProfile });
  } catch (err) {
    next(err);
  }
}
