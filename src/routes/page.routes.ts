import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createPage,
  getPages,
  getOpenings,
  getMyPages,
  getPage,
  updatePage,
  deletePage,
  addCompany,
  updateCompany,
  deleteCompany,
  addOpening,
  updateOpening,
  deleteOpening,
  createPageSchema,
  updatePageSchema,
  createCompanySchema,
  updateCompanySchema,
  createOpeningSchema,
  updateOpeningSchema,
} from '../controllers/page.controller';

const router = Router();

// Public routes
router.get('/', getPages);
router.get('/openings', getOpenings);
router.get('/my', requireAuth, getMyPages);
router.get('/:id', getPage);

// Page management (Auth + Recruiter/SELLER role)
router.post('/', requireAuth, requireRole('SELLER'), validate(createPageSchema), createPage);
router.patch('/:id', requireAuth, requireRole('SELLER'), validate(updatePageSchema), updatePage);
router.delete('/:id', requireAuth, requireRole('SELLER'), deletePage);

// Company management under Pages
router.post('/:id/companies', requireAuth, requireRole('SELLER'), validate(createCompanySchema), addCompany);
router.patch('/companies/:companyId', requireAuth, requireRole('SELLER'), validate(updateCompanySchema), updateCompany);
router.delete('/companies/:companyId', requireAuth, requireRole('SELLER'), deleteCompany);

// Role Opening management under Companies
router.post('/companies/:companyId/openings', requireAuth, requireRole('SELLER'), validate(createOpeningSchema), addOpening);
router.patch('/openings/:openingId', requireAuth, requireRole('SELLER'), validate(updateOpeningSchema), updateOpening);
router.delete('/openings/:openingId', requireAuth, requireRole('SELLER'), deleteOpening);

export default router;
