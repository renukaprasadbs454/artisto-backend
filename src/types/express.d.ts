/* eslint-disable @typescript-eslint/no-namespace */

/**
 * Augment Express Request to carry the authenticated user payload
 * set by the requireAuth middleware.
 */
declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      role: string;
    };
  }
}
