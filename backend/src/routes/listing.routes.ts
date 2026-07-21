import { Router } from 'express';
import { requireAuth, requireRole, requireProfileComplete } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { requireOwnership } from '../middleware/ownership';
import {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  createListingSchema,
  updateListingSchema,
} from '../controllers/listing.controller';

const router = Router();

// GET /api/v1/listings — public, with search/filter query params
router.get('/', getListings);

// GET /api/v1/listings/:id — public
router.get('/:id', getListing);

// POST /api/v1/listings — requires auth + SELLER role
router.post('/', requireAuth, requireProfileComplete, requireRole('SELLER'), validate(createListingSchema), createListing);

// PATCH /api/v1/listings/:id — requires auth + owner
router.patch(
  '/:id',
  requireAuth,
  requireProfileComplete,
  requireOwnership('listing', 'sellerId'),
  validate(updateListingSchema),
  updateListing
);

// DELETE /api/v1/listings/:id — requires auth + owner
router.delete(
  '/:id',
  requireAuth,
  requireProfileComplete,
  requireOwnership('listing', 'sellerId'),
  deleteListing
);

export default router;
