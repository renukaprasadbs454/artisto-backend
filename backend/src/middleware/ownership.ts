import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

/**
 * Generic ownership check middleware factory.
 * Loads a resource by ID from the given Prisma model and verifies
 * that the ownerField matches the authenticated user's ID.
 * 
 * Usage:
 *   requireOwnership('listing', 'sellerId')
 *   requireOwnership('portfolioItem', 'userId')
 */
export function requireOwnership(
  model: 'listing' | 'portfolioItem' | 'order',
  ownerField: string,
  paramName: string = 'id'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resourceId = req.params[paramName] as string;

      if (!resourceId) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Resource ID is required' },
        });
        return;
      }

      let resource: Record<string, unknown> | null = null;

      switch (model) {
        case 'listing':
          resource = await prisma.listing.findUnique({ where: { id: resourceId } }) as Record<string, unknown> | null;
          break;
        case 'portfolioItem':
          resource = await prisma.portfolioItem.findUnique({ where: { id: resourceId } }) as Record<string, unknown> | null;
          break;
        case 'order':
          resource = await prisma.order.findUnique({ where: { id: resourceId } }) as Record<string, unknown> | null;
          break;
      }

      if (!resource) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: `${model} not found` },
        });
        return;
      }

      if (resource[ownerField] !== req.user!.userId) {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'You do not own this resource' },
        });
        return;
      }

      // Attach the loaded resource to req so the controller doesn't need to re-fetch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).resource = resource;
      next();
    } catch (err) {
      next(err);
    }
  };
}
