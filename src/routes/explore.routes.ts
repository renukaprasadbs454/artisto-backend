import { Router } from 'express';
import { requireAuth, requireProfileComplete } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getExplores,
  getExploreProfile,
  getExploreProfileByUsername,
  upsertExploreProfile,
  addFilmCredit,
  deleteFilmCredit,
  upsertExploreLanguage,
  deleteExploreLanguage,
  upsertExploreProfileSchema,
  addFilmCreditSchema,
  upsertExploreLanguageSchema,
} from '../controllers/explore.controller';

const router = Router();

// GET /api/v1/explore — list explores
router.get('/', getExplores);

// GET /api/v1/explore/u/:username — public
router.get('/u/:username', getExploreProfileByUsername);

// GET /api/v1/explore/:userId — public
router.get('/:userId', getExploreProfile);

// POST /api/v1/explore/me — requires auth + profile complete
router.post(
  '/me',
  requireAuth,
  requireProfileComplete,
  validate(upsertExploreProfileSchema),
  upsertExploreProfile
);

// POST /api/v1/explore/me/credits — requires auth + profile complete
router.post(
  '/me/credits',
  requireAuth,
  requireProfileComplete,
  validate(addFilmCreditSchema),
  addFilmCredit
);

// DELETE /api/v1/explore/me/credits/:creditId
router.delete(
  '/me/credits/:creditId',
  requireAuth,
  requireProfileComplete,
  deleteFilmCredit
);

router.post('/me/languages', requireAuth, requireProfileComplete, validate(upsertExploreLanguageSchema), upsertExploreLanguage);
router.delete('/me/languages/:languageId', requireAuth, requireProfileComplete, deleteExploreLanguage);

export default router;