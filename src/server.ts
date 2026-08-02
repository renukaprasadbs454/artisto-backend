/// <reference path="../types/custom-express.d.ts" />

import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupMessaging } from './sockets/messaging';

const PORT = process.env.PORT || 4000;

const isDev = process.env.NODE_ENV !== 'production';
const frontendUrl = process.env.FRONTEND_URL;

// ─── Create HTTP server ───────────────────────────────────────────
// Express app and Socket.io share the same HTTP server instance.
// Never call app.listen() directly, or Socket.io won't share the port.
const httpServer = http.createServer(app);

// ─── Attach Socket.io ─────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!isDev) {
        return callback(null, origin === frontendUrl);
      }

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
    credentials: true,
  },
});

// Set up Socket.io auth middleware and event handlers
setupMessaging(io);

// ─── Start server ─────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   REST API:  http://localhost:${PORT}/api/v1`);
  console.log(`   WebSocket: http://localhost:${PORT}`);
  console.log(`   Health:    http://localhost:${PORT}/health`);
  console.log(`   Admin:     http://localhost:${PORT}/admin-panel`);
});