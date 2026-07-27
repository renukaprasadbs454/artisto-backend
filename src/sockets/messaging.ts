import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

/**
 * Set up Socket.io authentication middleware and event handlers.
 * Called once from server.ts after creating the io instance.
 */
export function setupMessaging(io: Server): void {
  // ─── Auth middleware ────────────────────────────────────────────
  // Verify JWT from the handshake before allowing the connection.
  // Never trust a userId sent as a message payload.
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Unauthorized: No token provided'));
      }

      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
        userId: string;
        role: string;
      };

      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Unauthorized: Invalid or expired token'));
    }
  });

  // ─── Connection handler ─────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.data.userId})`);

    /**
     * join:conversation — client requests to join a conversation room.
     * Server verifies the user is actually a participant before allowing.
     */
    socket.on('join:conversation', async ({ conversationId }: { conversationId: string }) => {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (
          conversation &&
          [conversation.participantOneId, conversation.participantTwoId].includes(socket.data.userId)
        ) {
          socket.join(conversationId);
          socket.emit('joined:conversation', { conversationId });
        } else {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
        }
      } catch (err) {
        console.error('Error joining conversation:', err);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    /**
     * message:send — client sends a message.
     * Write to Postgres first (DB is source of truth), then emit to room.
     * The socket.rooms.has() check stops a client from emitting to an
     * arbitrary conversationId it was never authorized to join.
     */
    socket.on('message:send', async ({ conversationId, content }: { conversationId: string; content: string }) => {
      try {
        // Must have joined the room first
        if (!socket.rooms.has(conversationId)) {
          socket.emit('error', { message: 'Not a member of this conversation room' });
          return;
        }

        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message content cannot be empty' });
          return;
        }

        // Persist first — DB is the source of truth
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.data.userId,
            content: content.trim(),
          },
          include: {
            sender: {
              select: {
                id: true,
                profile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        });

        // Emit to all participants in the room (including sender for reconciliation)
        io.to(conversationId).emit('message:new', message);
      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * message:read — client marks all unread messages in a conversation as read.
     * Updates all messages NOT sent by this user that haven't been read yet.
     */
    socket.on('message:read', async ({ conversationId }: { conversationId: string }) => {
      try {
        if (!socket.rooms.has(conversationId)) return;

        const readAt = new Date();

        await prisma.message.updateMany({
          where: {
            conversationId,
            senderId: { not: socket.data.userId },
            readAt: null,
          },
          data: { readAt },
        });

        // Notify all in the room about the read receipt
        io.to(conversationId).emit('message:read:ack', {
          conversationId,
          readerId: socket.data.userId,
          readAt,
        });
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (user: ${socket.data.userId})`);
    });
  });
}
