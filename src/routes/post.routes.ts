import { Router } from 'express';
import { requireAuth, requireProfileComplete } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import {
  getPosts,
  createPost,
  toggleLike,
  addComment,
  getComments,
  createPostSchema,
  createCommentSchema,
} from '../controllers/post.controller';

const router = Router();

// GET /api/v1/posts — requires auth to know liked status, but maybe we can allow without?
// Let's require auth for now since it's a professional network feed.
router.get('/', requireAuth, getPosts);

// POST /api/v1/posts — requires auth + profile complete
// allow image upload
router.post(
  '/',
  requireAuth,
  requireProfileComplete,
  upload.single('image'),
  validate(createPostSchema),
  createPost
);

// POST /api/v1/posts/:id/like — toggle like
router.post('/:id/like', requireAuth, requireProfileComplete, toggleLike);

// GET /api/v1/posts/:id/comments
router.get('/:id/comments', requireAuth, getComments);

// POST /api/v1/posts/:id/comments
router.post(
  '/:id/comments',
  requireAuth,
  requireProfileComplete,
  validate(createCommentSchema),
  addComment
);

export default router;
