import { Router } from 'express';
import { requireAuth, requireProfileComplete } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { requireOwnership } from '../middleware/ownership';
import { upload } from '../middleware/upload';
import {
  getPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  uploadPortfolioImages,
  createPortfolioSchema,
  updatePortfolioSchema,
} from '../controllers/portfolio.controller';

const router = Router();

// GET /api/v1/portfolio/:userId — public
router.get('/:userId', getPortfolio);

// POST /api/v1/portfolio — requires auth
router.post('/', requireAuth, requireProfileComplete, validate(createPortfolioSchema), createPortfolioItem);

// PATCH /api/v1/portfolio/:id — requires auth + owner
router.patch(
  '/:id',
  requireAuth,
  requireProfileComplete,
  requireOwnership('portfolioItem', 'userId'),
  validate(updatePortfolioSchema),
  updatePortfolioItem
);

// DELETE /api/v1/portfolio/:id — requires auth + owner
router.delete(
  '/:id',
  requireAuth,
  requireProfileComplete,
  requireOwnership('portfolioItem', 'userId'),
  deletePortfolioItem
);

// POST /api/v1/portfolio/:id/images — requires auth + owner, multi-file upload (max 6)
router.post(
  '/:id/images',
  requireAuth,
  requireProfileComplete,
  upload.array('images', 6),
  uploadPortfolioImages
);

export default router;
