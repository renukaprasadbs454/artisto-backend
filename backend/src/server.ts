import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupMessaging } from './sockets/messaging';

const PORT = process.env.PORT || 4000;

// ─── Create HTTP server ───────────────────────────────────────────
// Express app and Socket.io share the same HTTP server instance.
// Never call app.listen() directly, or Socket.io won't share the port.
const httpServer = http.createServer(app);

// ─── Attach Socket.io ─────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
});
