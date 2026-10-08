import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Conversation } from './models';
import { getJwtSecret } from './config';

let io: Server | null = null;

export function initSocketIO(server: HttpServer, clientUrl: string): Server {
  io = new Server(server, {
    cors: {
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        const cookieMatch =
          socket.handshake.headers.cookie.match(/token=([^;]+)/);
        if (cookieMatch) {
          token = cookieMatch[1];
        }
      }

      if (
        !token &&
        socket.handshake.headers.authorization?.startsWith('Bearer ')
      ) {
        token = socket.handshake.headers.authorization.split(' ')[1];
      }

      if (token) {
        const secret = getJwtSecret();
        const decoded = jwt.verify(token, secret) as any;
        socket.data.user = decoded;
      }
      next();
    } catch (_err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.on(
      'join_rooms',
      (data: { schoolId: string; userId: string; role: string }) => {
        if (data.schoolId) {
          socket.join(`school:${data.schoolId}`);
          if (data.role) {
            socket.join(`school:${data.schoolId}:role:${data.role}`);
          }
        }
        if (data.userId) {
          socket.join(`user:${data.userId}`);
        }
      }
    );

    socket.on('join_conversation', async (data: { conversationId: string }) => {
      try {
        const user = socket.data.user;
        if (!user || !user.userId) {
          socket.emit('conversation_error', {
            message: 'Authentication required',
          });
          return;
        }

        const conv = await Conversation.findById(data.conversationId).lean();
        if (!conv) {
          socket.emit('conversation_error', {
            message: 'Conversation not found',
          });
          return;
        }

        const isParticipant = conv.participantIds.some(
          (p: any) => p.toString() === user.userId.toString()
        );

        if (!isParticipant) {
          socket.emit('conversation_error', {
            message:
              'Forbidden: You are not a participant in this conversation',
          });
          return;
        }

        socket.join(`conversation:${data.conversationId}`);
        socket.emit('conversation_joined', {
          conversationId: data.conversationId,
        });
      } catch (_error) {
        socket.emit('conversation_error', {
          message: 'Failed to join conversation room',
        });
      }
    });

    socket.on('leave_conversation', (data: { conversationId: string }) => {
      if (data.conversationId) {
        socket.leave(`conversation:${data.conversationId}`);
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitToSchool(
  schoolId: string,
  event: string,
  data: unknown
): void {
  if (io) {
    io.to(`school:${schoolId}`).emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToRole(
  schoolId: string,
  role: string,
  event: string,
  data: unknown
): void {
  if (io) {
    io.to(`school:${schoolId}:role:${role}`).emit(event, data);
  }
}

export function emitToConversation(
  conversationId: string,
  event: string,
  data: unknown
): void {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}
