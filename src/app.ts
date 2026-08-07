import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';

// Load environment variables before anything else
dotenv.config();

const app = express();

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// ─── Core middleware ──────────────────────────────────────────────

// CORS — allow production FRONTEND_URL, but in development accept any localhost origin
const isDev = process.env.NODE_ENV !== 'production';
const frontendUrl = process.env.FRONTEND_URL;
app.use(
  cors({
    origin: (origin, callback) => {
          if (!origin) return callback(null, true); // allow non-browser requests like curl/postman
      if (!isDev) {
        try {
          const url = new URL(origin);
          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            return callback(null, true);
          }
        } catch (e) {
          // fall through
        }
        return callback(null, origin === frontendUrl);
      }
      // In development allow any localhost with any port (e.g., vite may use 5173,5174...)
      try {
        const url = new URL(origin);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch (e) {
        // fall through
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Required for the refresh cookie to be sent cross-origin
  })
);

// Parse JSON request bodies and capture raw body (dev only) so we can debug malformed JSON
app.use(express.json({
  verify: (req: any, _res, buf) => {
    if (process.env.NODE_ENV !== 'production') {
      req.rawBody = buf && buf.toString ? buf.toString() : '';
    }
  },
}));

// Dev helper: log raw body for auth login attempts to help debug client-side JSON issues
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    if (req.method === 'POST' && req.path === '/api/v1/auth/login') {
      console.log('DEV RAW BODY /auth/login ->', (req as any).rawBody);
    }
    next();
  });
}

// Parse cookies (needed for refresh token)
app.use(cookieParser());

import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swagger';
import { apiLimiter } from './middleware/rateLimiter';

// ─── Swagger API Documentation ────────────────────────────────────

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ─── Health check & Base Routes ───────────────────────────────────

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Artisto API Service', version: 'v1' });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/v1', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Artisto API v1', docs: 'http://localhost:4000/api-docs' });
});

// ─── API routes ───────────────────────────────────────────────────

app.use('/api/v1', apiLimiter, routes);

// Dedicated backend-owned administrator interface. It contains no privileged
// data; every API operation still requires a valid ADMIN bearer token.
const adminPanelPath = path.resolve(process.cwd(), 'admin');
app.use('/admin-panel', express.static(adminPanelPath, { index: 'index.html', fallthrough: false }));

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
