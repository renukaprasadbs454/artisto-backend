import { Router } from 'express';
import { requireAuth, requireProfileComplete } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getActors,
  getActorProfile,
  getActorProfileByUsername,
  upsertActorProfile,
  addFilmCredit,
  deleteFilmCredit,
  upsertActorLanguage,
  deleteActorLanguage,
  upsertActorProfileSchema,
  addFilmCreditSchema,
  upsertActorLanguageSchema,
} from '../controllers/actor.controller';

const router = Router();

// GET /api/v1/actor — list actors
router.get('/', getActors);

// GET /api/v1/actor/u/:username — public
router.get('/u/:username', getActorProfileByUsername);

// GET /api/v1/actor/:userId — public
router.get('/:userId', getActorProfile);

// POST /api/v1/actor/me — requires auth + profile complete
router.post(
  '/me',
  requireAuth,
  requireProfileComplete,
  validate(upsertActorProfileSchema),
  upsertActorProfile
);

// POST /api/v1/actor/me/credits — requires auth + profile complete
router.post(
  '/me/credits',
  requireAuth,
  requireProfileComplete,
  validate(addFilmCreditSchema),
  addFilmCredit
);

// DELETE /api/v1/actor/me/credits/:creditId
router.delete(
  '/me/credits/:creditId',
  requireAuth,
  requireProfileComplete,
  deleteFilmCredit
);

router.post('/me/languages', requireAuth, requireProfileComplete, validate(upsertActorLanguageSchema), upsertActorLanguage);
router.delete('/me/languages/:languageId', requireAuth, requireProfileComplete, deleteActorLanguage);

export default router;
