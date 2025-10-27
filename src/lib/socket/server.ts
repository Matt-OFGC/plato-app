// Socket.io server setup with authentication and room-based messaging
// Handles real-time communication for messages, presence, and domain events

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getSession } from '@/lib/auth-simple';
import { prisma } from '@/lib/prisma';
import { EventTypes } from '@/lib/events/domain-events';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  companyId?: number;
  userEmail?: string;
}

interface SocketEvents {
  // Client → Server
  'message:send': (data: { channelId: number; content: string; replyTo?: number }) => void;
  'message:edit': (data: { messageId: number; content: string }) => void;
  'message:delete': (data: { messageId: number }) => void;
  'message:react': (data: { messageId: number; emoji: string }) => void;
  
  'channel:join': (data: { channelId: number }) => void;
  'channel:leave': (data: { channelId: number }) => void;
  'channel:create': (data: { name: string; description?: string; isPrivate?: boolean }) => void;
  
  'typing:start': (data: { channelId: number }) => void;
  'typing:stop': (data: { channelId: number }) => void;
  
  'presence:update': (data: { status: 'online' | 'away' | 'busy' }) => void;
  
  // Server → Client
  'message:new': (data: any) => void;
  'message:updated': (data: any) => void;
  'message:deleted': (data: { messageId: number }) => void;
  'message:reaction': (data: { messageId: number; emoji: string; userId: number; action: 'add' | 'remove' }) => void;
  
  'channel:joined': (data: { channelId: number; user: any }) => void;
  'channel:left': (data: { channelId: number; user: any }) => void;
  'channel:created': (data: any) => void;
  
  'typing:indicator': (data: { channelId: number; user: any; isTyping: boolean }) => void;
  
  'user:joined': (data: { channelId: number; user: any }) => void;
  'user:left': (data: { channelId: number; user: any }) => void;
  'user:presence': (data: { userId: number; status: string; lastSeen: Date }) => void;
  
  'domain:event': (data: { eventType: string; payload: any; timestamp: Date }) => void;
  
  'error': (data: { message: string; code?: string }) => void;
}

class SocketManager {
  private io: SocketIOServer;
  private connectedUsers: Map<number, Set<string>> = new Map(); // userId -> Set of socketIds
  private channelMembers: Map<number, Set<number>> = new Map(); // channelId -> Set of userIds
  private typingUsers: Map<number, Map<number, Date>> = new Map(); // channelId -> Map of userId -> timestamp

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const session = await getSession();
        
        if (!session?.user) {
          return next(new Error('Authentication required'));
        }

        // Get user details from database
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: {
            memberships: {
              where: { isActive: true },
              include: { company: true },
            },
          },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        // Get the primary company (first active membership)
        const primaryMembership = user.memberships[0];
        if (!primaryMembership) {
          return next(new Error('No active company membership'));
        }

        socket.userId = user.id;
        socket.companyId = primaryMembership.companyId;
        socket.userEmail = user.email;

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Company isolation middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      if (!socket.companyId) {
        return next(new Error('Company ID required'));
      }
      
      // Join company-specific room
      socket.join(`company:${socket.companyId}`);
      next();
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected to company ${socket.companyId}`);

      // Track connected user
      this.trackUserConnection(socket);

      // Handle message events
      this.setupMessageHandlers(socket);
      
      // Handle channel events
      this.setupChannelHandlers(socket);
      
      // Handle typing events
      this.setupTypingHandlers(socket);
      
      // Handle presence events
      this.setupPresenceHandlers(socket);
      
      // Handle domain events
      this.setupDomainEventHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        this.handleDisconnection(socket);
      });
    });
  }

  private trackUserConnection(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    if (!this.connectedUsers.has(socket.userId)) {
      this.connectedUsers.set(socket.userId, new Set());
    }
    
    this.connectedUsers.get(socket.userId)!.add(socket.id);

    // Notify all channels this user is in
    this.notifyUserPresence(socket, 'online');
  }

  private handleDisconnection(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    const userSockets = this.connectedUsers.get(socket.userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      
      if (userSockets.size === 0) {
        // User is completely offline
        this.connectedUsers.delete(socket.userId);
        this.notifyUserPresence(socket, 'offline');
      }
    }
  }

  private setupMessageHandlers(socket: AuthenticatedSocket) {
    socket.on('message:send', async (data) => {
      try {
        const { channelId, content, replyTo } = data;
        
        // Verify user has access to channel
        const hasAccess = await this.verifyChannelAccess(socket.userId!, channelId, socket.companyId!);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied', code: 'CHANNEL_ACCESS_DENIED' });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            channelId,
            userId: socket.userId!,
            content,
            replyTo,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            replyToMessage: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        // Broadcast to channel members
        this.io.to(`channel:${channelId}`).emit('message:new', message);
        
        // Update last activity
        await prisma.channel.update({
          where: { id: channelId },
          data: { lastActivityAt: new Date() },
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data;
        
        // Verify ownership
        const message = await prisma.message.findFirst({
          where: {
            id: messageId,
            userId: socket.userId!,
          },
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found or access denied' });
          return;
        }

        // Update message
        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: { content, editedAt: new Date() },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Broadcast update
        this.io.to(`channel:${message.channelId}`).emit('message:updated', updatedMessage);

      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data;
        
        // Verify ownership
        const message = await prisma.message.findFirst({
          where: {
            id: messageId,
            userId: socket.userId!,
          },
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found or access denied' });
          return;
        }

        // Delete message
        await prisma.message.delete({
          where: { id: messageId },
        });

        // Broadcast deletion
        this.io.to(`channel:${message.channelId}`).emit('message:deleted', { messageId });

      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    socket.on('message:react', async (data) => {
      try {
        const { messageId, emoji } = data;
        
        // Check if reaction already exists
        const existingReaction = await prisma.messageReaction.findFirst({
          where: {
            messageId,
            userId: socket.userId!,
            emoji,
          },
        });

        if (existingReaction) {
          // Remove reaction
          await prisma.messageReaction.delete({
            where: { id: existingReaction.id },
          });
          
          this.io.to(`channel:${existingReaction.message.channelId}`).emit('message:reaction', {
            messageId,
            emoji,
            userId: socket.userId!,
            action: 'remove',
          });
        } else {
          // Add reaction
          await prisma.messageReaction.create({
            data: {
              messageId,
              userId: socket.userId!,
              emoji,
            },
          });
          
          this.io.to(`channel:${messageId}`).emit('message:reaction', {
            messageId,
            emoji,
            userId: socket.userId!,
            action: 'add',
          });
        }

      } catch (error) {
        console.error('Error reacting to message:', error);
        socket.emit('error', { message: 'Failed to react to message' });
      }
    });
  }

  private setupChannelHandlers(socket: AuthenticatedSocket) {
    socket.on('channel:join', async (data) => {
      try {
        const { channelId } = data;
        
        // Verify access
        const hasAccess = await this.verifyChannelAccess(socket.userId!, channelId, socket.companyId!);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied', code: 'CHANNEL_ACCESS_DENIED' });
          return;
        }

        // Join channel room
        socket.join(`channel:${channelId}`);
        
        // Track channel membership
        if (!this.channelMembers.has(channelId)) {
          this.channelMembers.set(channelId, new Set());
        }
        this.channelMembers.get(channelId)!.add(socket.userId!);

        // Get user info
        const user = await prisma.user.findUnique({
          where: { id: socket.userId! },
          select: { id: true, name: true, email: true },
        });

        // Notify channel members
        socket.to(`channel:${channelId}`).emit('channel:joined', {
          channelId,
          user,
        });

      } catch (error) {
        console.error('Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    socket.on('channel:leave', async (data) => {
      try {
        const { channelId } = data;
        
        // Leave channel room
        socket.leave(`channel:${channelId}`);
        
        // Update channel membership
        const members = this.channelMembers.get(channelId);
        if (members) {
          members.delete(socket.userId!);
          if (members.size === 0) {
            this.channelMembers.delete(channelId);
          }
        }

        // Get user info
        const user = await prisma.user.findUnique({
          where: { id: socket.userId! },
          select: { id: true, name: true, email: true },
        });

        // Notify channel members
        socket.to(`channel:${channelId}`).emit('channel:left', {
          channelId,
          user,
        });

      } catch (error) {
        console.error('Error leaving channel:', error);
        socket.emit('error', { message: 'Failed to leave channel' });
      }
    });

    socket.on('channel:create', async (data) => {
      try {
        const { name, description, isPrivate } = data;
        
        // Create channel
        const channel = await prisma.channel.create({
          data: {
            name,
            description,
            isPrivate: isPrivate || false,
            companyId: socket.companyId!,
            createdBy: socket.userId!,
            members: {
              create: {
                userId: socket.userId!,
                role: 'ADMIN',
                joinedAt: new Date(),
              },
            },
          },
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        // Join the new channel
        socket.join(`channel:${channel.id}`);
        
        // Track membership
        this.channelMembers.set(channel.id, new Set([socket.userId!]));

        // Broadcast to company
        this.io.to(`company:${socket.companyId}`).emit('channel:created', channel);

      } catch (error) {
        console.error('Error creating channel:', error);
        socket.emit('error', { message: 'Failed to create channel' });
      }
    });
  }

  private setupTypingHandlers(socket: AuthenticatedSocket) {
    socket.on('typing:start', async (data) => {
      try {
        const { channelId } = data;
        
        // Verify access
        const hasAccess = await this.verifyChannelAccess(socket.userId!, channelId, socket.companyId!);
        if (!hasAccess) return;

        // Track typing
        if (!this.typingUsers.has(channelId)) {
          this.typingUsers.set(channelId, new Map());
        }
        this.typingUsers.get(channelId)!.set(socket.userId!, new Date());

        // Get user info
        const user = await prisma.user.findUnique({
          where: { id: socket.userId! },
          select: { id: true, name: true, email: true },
        });

        // Broadcast typing indicator
        socket.to(`channel:${channelId}`).emit('typing:indicator', {
          channelId,
          user,
          isTyping: true,
        });

        // Set timeout to stop typing
        setTimeout(() => {
          this.typingUsers.get(channelId)?.delete(socket.userId!);
          socket.to(`channel:${channelId}`).emit('typing:indicator', {
            channelId,
            user,
            isTyping: false,
          });
        }, 3000);

      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });

    socket.on('typing:stop', async (data) => {
      try {
        const { channelId } = data;
        
        // Remove typing
        this.typingUsers.get(channelId)?.delete(socket.userId!);

        // Get user info
        const user = await prisma.user.findUnique({
          where: { id: socket.userId! },
          select: { id: true, name: true, email: true },
        });

        // Broadcast stop typing
        socket.to(`channel:${channelId}`).emit('typing:indicator', {
          channelId,
          user,
          isTyping: false,
        });

      } catch (error) {
        console.error('Error handling typing stop:', error);
      }
    });
  }

  private setupPresenceHandlers(socket: AuthenticatedSocket) {
    socket.on('presence:update', async (data) => {
      try {
        const { status } = data;
        
        // Update user status in database
        await prisma.user.update({
          where: { id: socket.userId! },
          data: { lastSeenAt: new Date() },
        });

        // Broadcast presence update
        this.io.to(`company:${socket.companyId}`).emit('user:presence', {
          userId: socket.userId!,
          status,
          lastSeen: new Date(),
        });

      } catch (error) {
        console.error('Error updating presence:', error);
      }
    });
  }

  private setupDomainEventHandlers(socket: AuthenticatedSocket) {
    // Listen for domain events and broadcast to relevant users
    // This would be called when domain events are emitted
  }

  private async verifyChannelAccess(userId: number, channelId: number, companyId: number): Promise<boolean> {
    try {
      const membership = await prisma.channelMember.findFirst({
        where: {
          channelId,
          userId,
          channel: {
            companyId,
          },
        },
      });

      return !!membership;
    } catch (error) {
      console.error('Error verifying channel access:', error);
      return false;
    }
  }

  private async notifyUserPresence(socket: AuthenticatedSocket, status: 'online' | 'offline') {
    try {
      // Get user's channels
      const channels = await prisma.channelMember.findMany({
        where: { userId: socket.userId! },
        select: { channelId: true },
      });

      // Notify each channel
      for (const channel of channels) {
        this.io.to(`channel:${channel.channelId}`).emit('user:presence', {
          userId: socket.userId!,
          status,
          lastSeen: new Date(),
        });
      }
    } catch (error) {
      console.error('Error notifying user presence:', error);
    }
  }

  // Public method to broadcast domain events
  public broadcastDomainEvent(companyId: number, eventType: EventTypes, payload: any) {
    this.io.to(`company:${companyId}`).emit('domain:event', {
      eventType,
      payload,
      timestamp: new Date(),
    });
  }

  // Public method to get connected users count
  public getConnectedUsersCount(companyId: number): number {
    let count = 0;
    for (const [userId, sockets] of this.connectedUsers) {
      if (sockets.size > 0) {
        count++;
      }
    }
    return count;
  }

  // Public method to get channel members count
  public getChannelMembersCount(channelId: number): number {
    return this.channelMembers.get(channelId)?.size || 0;
  }
}

export default SocketManager;
