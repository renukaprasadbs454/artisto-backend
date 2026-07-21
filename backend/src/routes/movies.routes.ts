import { Router } from 'express';
import { requireAuth, requireProfileComplete } from '../middleware/auth';
import { searchMovies } from '../controllers/movies.controller';

const router = Router();

// GET /api/v1/movies/search — requires auth
router.get('/search', requireAuth, requireProfileComplete, searchMovies);

export default router;
