import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { uploadToStorage } from '../services/storage.service';

// ─── Validation Schemas ─────────────────────────────────────────────

export const createPortfolioSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  projectUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const updatePortfolioSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  projectUrl: z.string().url().optional().or(z.literal('')),
}).strict();

// ─── Controllers ────────────────────────────────────────────────────

/**
 * GET /portfolio/:userId
 * Public — view a user's portfolio items with their images.
 */
export async function getPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId as string;

    const items = await prisma.portfolioItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch images for each portfolio item from Media table
    const itemIds = items.map((item) => item.id);
    const images = await prisma.media.findMany({
      where: {
        ownerType: 'PORTFOLIO',
        entityId: { in: itemIds },
      },
      select: { id: true, entityId: true, url: true },
    });

    // Group images by entityId
    const imageMap = new Map<string, { id: string; url: string }[]>();
    for (const img of images) {
      const list = imageMap.get(img.entityId!) || [];
      list.push({ id: img.id, url: img.url });
      imageMap.set(img.entityId!, list);
    }

    const itemsWithImages = items.map((item) => ({
      ...item,
      images: imageMap.get(item.id) || [],
    }));

    res.status(200).json({ data: itemsWithImages });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /portfolio
 * Create a new portfolio item for the authenticated user.
 */
export async function createPortfolioItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await prisma.portfolioItem.create({
      data: {
        ...req.body,
        userId: req.user!.userId,
      },
    });

    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /portfolio/:id
 * Edit a portfolio item — owner only (checked by ownership middleware).
 */
export async function updatePortfolioItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const item = await prisma.portfolioItem.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json({ data: item });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /portfolio/:id
 * Delete a portfolio item — owner only.
 */
export async function deletePortfolioItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    // Also delete associated media records
    await prisma.$transaction([
      prisma.media.deleteMany({
        where: { ownerType: 'PORTFOLIO', entityId: id },
      }),
      prisma.portfolioItem.delete({
        where: { id },
      }),
    ]);

    res.status(200).json({ data: { message: 'Portfolio item deleted' } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /portfolio/:id/images
 * Upload images (up to 6) for a portfolio item. Owner only.
 */
export async function uploadPortfolioImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const portfolioItemId = req.params.id as string;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'No files uploaded' },
      });
      return;
    }

    // Verify the portfolio item exists and belongs to the user
    const item = await prisma.portfolioItem.findUnique({
      where: { id: portfolioItemId },
    });

    if (!item) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Portfolio item not found' },
      });
      return;
    }

    if (item.userId !== req.user!.userId) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You do not own this portfolio item' },
      });
      return;
    }

    // Upload all files to Supabase Storage and create Media records
    const uploadResults = await Promise.all(
      files.map((file) => uploadToStorage(file, 'portfolio'))
    );

    const mediaRecords = await prisma.$transaction(
      uploadResults.map(({ url, key }) =>
        prisma.media.create({
          data: {
            ownerId: req.user!.userId,
            ownerType: 'PORTFOLIO',
            entityId: portfolioItemId,
            url,
            s3Key: key,
          },
        })
      )
    );

    res.status(201).json({
      data: mediaRecords.map((m) => ({ id: m.id, url: m.url })),
    });
  } catch (err) {
    next(err);
  }
}
