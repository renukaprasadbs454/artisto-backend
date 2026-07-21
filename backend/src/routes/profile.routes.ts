import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadBanner,
  updateProfileSchema,
  getProfileByUsername,
  updateRole,
  updateRoleSchema
} from '../controllers/profile.controller';

const router = Router();

// GET /api/v1/profiles/u/:username — public
router.get('/u/:username', getProfileByUsername);

// GET /api/v1/profiles/:userId — public
router.get('/:userId', getProfile);

// PATCH /api/v1/profiles/me — requires auth
router.patch('/me', requireAuth, validate(updateProfileSchema), updateProfile);

// PATCH /api/v1/profiles/role — requires auth
router.patch('/role', requireAuth, validate(updateRoleSchema), updateRole);

// POST /api/v1/profiles/me/avatar — requires auth, multipart upload
router.post('/me/avatar', requireAuth, upload.single('avatar'), uploadAvatar);

// POST /api/v1/profiles/me/banner — requires auth, multipart upload
router.post('/me/banner', requireAuth, upload.single('banner'), uploadBanner);

export default router;
