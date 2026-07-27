import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '../utils/constants';

// ─── Validation Schemas ─────────────────────────────────────────────

export const createListingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  category: z.string().min(1, 'Category is required').max(100),
  price: z.number().positive('Price must be positive').max(999999.99),
  deliveryDays: z.number().int().positive('Delivery days must be a positive integer'),
});

export const updateListingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().min(1).max(100).optional(),
  price: z.number().positive().max(999999.99).optional(),
  deliveryDays: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
}).strict();

export const listingQuerySchema = z.object({
  category: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  q: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// ─── Controllers ────────────────────────────────────────────────────

/**
 * GET /listings
 * Public search/browse with optional filters: category, minPrice, maxPrice, q (text search).
 */
export async function getListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = req.query.category as string | undefined;
    const minPrice = req.query.minPrice as string | undefined;
    const maxPrice = req.query.maxPrice as string | undefined;
    const q = req.query.q as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    // Build the where clause incrementally from whichever query params are present
    const where: Prisma.ListingWhereInput = { status: 'ACTIVE' };

    if (category) {
      where.category = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice && !isNaN(Number(minPrice))) (where.price as Prisma.DecimalFilter).gte = Number(minPrice);
      if (maxPrice && !isNaN(Number(maxPrice))) (where.price as Prisma.DecimalFilter).lte = Number(maxPrice);
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: {
              id: true,
              profile: {
                select: { displayName: true, avatarUrl: true },
              },
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    res.status(200).json({
      data: listings,
      meta: { page, limit, total },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /listings/:id
 * Public — view a single listing with seller info.
 */
export async function getListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            role: true,
            profile: {
              select: { displayName: true, avatarUrl: true, headline: true, location: true },
            },
          },
        },
      },
    });

    if (!listing) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Listing not found' },
      });
      return;
    }

    res.status(200).json({ data: listing });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /listings
 * Create a new listing — SELLER role required.
 */
export async function createListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const listing = await prisma.listing.create({
      data: {
        ...req.body,
        sellerId: req.user!.userId,
      },
    });

    res.status(201).json({ data: listing });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /listings/:id
 * Edit an existing listing — owner only (checked by ownership middleware).
 */
export async function updateListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const listing = await prisma.listing.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json({ data: listing });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /listings/:id
 * Delete a listing — owner only.
 */
export async function deleteListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const existingOrdersCount = await prisma.order.count({
      where: { listingId: id },
    });

    if (existingOrdersCount > 0) {
      res.status(409).json({
        error: { code: 'CONFLICT', message: 'Cannot delete a listing that has associated orders' },
      });
      return;
    }

    await prisma.listing.delete({
      where: { id },
    });

    res.status(200).json({ data: { message: 'Listing deleted' } });
  } catch (err) {
    next(err);
  }
}
