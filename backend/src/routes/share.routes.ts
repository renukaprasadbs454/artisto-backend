import { Router } from 'express';
import { shareProfile, shareActorProfile } from '../controllers/share.controller';

const router = Router();

// GET /api/v1/share/profile/:username
router.get('/profile/:username', shareProfile);

// GET /api/v1/share/actor/:username
router.get('/actor/:username', shareActorProfile);

export default router;
