import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  registerSchema,
  loginSchema,
  usernameSuggestions,
  checkUsernameAvailability,
  resetPassword,
  resetPasswordSchema,
  changePassword,
  changePasswordSchema,
} from '../controllers/auth.controller';

const router = Router();

// POST /api/v1/auth/register — public, rate-limited
router.post('/register', authLimiter, validate(registerSchema), register);

// POST /api/v1/auth/login — public, rate-limited
router.post('/login', authLimiter, validate(loginSchema), login);

// POST /api/v1/auth/refresh — cookie-based, rate-limited
router.post('/refresh', authLimiter, refresh);

// POST /api/v1/auth/logout — cookie-based
router.post('/logout', logout);

// GET /api/v1/auth/check-username — public, real-time signup availability checker
router.get('/check-username', checkUsernameAvailability);

// GET /api/v1/auth/username-suggestions?username=base — public
router.get('/username-suggestions', usernameSuggestions);

// GET /api/v1/auth/me — requires auth
router.get('/me', requireAuth, getMe);

// POST /api/v1/auth/reset-password — requires auth
router.post('/reset-password', requireAuth, validate(resetPasswordSchema), resetPassword);

// POST /api/v1/auth/change-password — requires the current password
router.post('/change-password', requireAuth, validate(changePasswordSchema), changePassword);

export default router;
