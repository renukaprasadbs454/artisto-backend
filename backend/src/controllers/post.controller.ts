import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { uploadToStorage } from '../services/storage.service';

export const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
}).strict();

export const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
}).strict();

/**
 * GET /posts
 * Returns latest posts with author profile and stats.
 */
export async function getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = req.user?.userId; // Optional, for checking 'likedByMe'

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                headline: true,
              },
            },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
        // We only want to know if the current user liked it
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            take: 1,
          },
        }),
      },
    });

    const formattedPosts = posts.map((post: any) => {
      const { likes, ...rest } = post as any;
      return {
        ...rest,
        likedByMe: currentUserId ? (likes?.length > 0) : false,
      };
    });

    res.status(200).json({ data: formattedPosts });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /posts
 * Create a new post. (requires auth + profile complete)
 */
export async function createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { content } = req.body;
    let imageUrl = null;

    if (req.file) {
      const uploadResult = await uploadToStorage(req.file, 'posts');
      imageUrl = uploadResult.url;
    }

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        content,
        imageUrl,
      },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    res.status(201).json({ data: { ...post, likedByMe: false } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /posts/:id/like
 * Toggle like on a post.
 */
export async function toggleLike(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id as string;

    const existingLike = await prisma.postLike.findFirst({
      where: { postId, userId },
    });

    if (existingLike) {
      await prisma.postLike.deleteMany({
        where: { postId, userId },
      });
      res.status(200).json({ data: { liked: false } });
    } else {
      try {
        await prisma.postLike.create({
          data: { postId, userId },
        });
      } catch {
        // Ignore duplicate insert if any
      }
      res.status(200).json({ data: { liked: true } });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * POST /posts/:id/comments
 * Add a comment to a post.
 */
export async function addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id as string;
    const { content } = req.body;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }

    const comment = await prisma.postComment.create({
      data: {
        postId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({ data: comment });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /posts/:id/comments
 * Get comments for a post.
 */
export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = req.params.id as string;

    const comments = await prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({ data: comments });
  } catch (err) {
    next(err);
  }
}
