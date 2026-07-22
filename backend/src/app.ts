import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes';

// Load environment variables before anything else
dotenv.config();

const app = express();

// ─── Core middleware ──────────────────────────────────────────────

// CORS — explicit allow-list: production frontend + localhost for dev
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Required for the refresh cookie to be sent cross-origin
  })
);

// Parse JSON request bodies
app.use(express.json());

// Parse cookies (needed for refresh token)
app.use(cookieParser());

import { apiLimiter } from './middleware/rateLimiter';

// ─── Health check & Base Routes ───────────────────────────────────

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Artisto API Service', version: 'v1' });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/v1', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Artisto API v1' });
});

// ─── API routes ───────────────────────────────────────────────────

app.use('/api/v1', apiLimiter, routes);

// ─── 404 handler ──────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// ─── Global error handler ─────────────────────────────────────────
// 4-arg signature tells Express this is an error handler.
// Returns the { error: { code, message } } shape from the system design doc.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Multer file filter errors come as regular Errors
  if (err.message === 'Invalid file type. Only JPEG, PNG, and WebP are allowed.') {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message },
    });
    return;
  }

  // Multer file size limit
  if (err.message?.includes('File too large')) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'File size exceeds 5MB limit' },
    });
    return;
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
});

export default app;
