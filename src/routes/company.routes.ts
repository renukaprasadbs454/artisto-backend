import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { list, get, create, addOpening, remove, apply, getApplicants, checkUsername, companySchema, openingSchema } from '../controllers/company.controller';
const router = Router();
router.get('/', list); router.get('/check-username', checkUsername); router.get('/u/:username', get); router.post('/', requireAuth, validate(companySchema), create); router.delete('/:id', requireAuth, remove); router.post('/:id/openings', requireAuth, validate(openingSchema), addOpening); router.post('/openings/:openingId/apply', requireAuth, apply); router.get('/openings/:openingId/applicants', requireAuth, getApplicants);
export default router;
