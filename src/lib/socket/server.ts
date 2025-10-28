// Socket.io Server Manager
// Handles WebSocket connections, authentication, and room management

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getSession } from '@/lib/auth-simple';

interface AuthenticatedSocket extends SocketIOServer.Socket {
  userId?: number;
  companyId?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    companyId: number;
  };
}

class SocketManager {
  private io: SocketIOServer;
  private connectedUsers: Map<number, Set<string>> = new Map(); // userId -> Set of socketIds
  private companyRooms: Map<number, Set<string>> = new Map(); // companyId -> Set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      path: '/api/socketio',
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const session = await getSession();
        
        if (!session?.user) {
          return next(new Error('Authentication required'));
        }

        socket.userId = session.user.id;
        socket.companyId = session.user.companyId;
        socket.user = {
          id: session.user.id,
          name: session.user.name || 'Unknown User',
          email: session.user.email,
          companyId: session.user.companyId,
        };

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected to Socket.io for company ${socket.companyId}`);

      // Track connected user
      this.trackUser(socket);

      // Join personal room
      socket.join(`user-${socket.userId}`);
      
      // Join company room
      if (socket.companyId) {
        socket.join(`company-${socket.companyId}`);
        this.trackCompanyUser(socket);
      }

      // Message events
      socket.on('message:send', async (data) => {
        await this.handleMessageSend(socket, data);
      });

      socket.on('message:edit', async (data) => {
        await this.handleMessageEdit(socket, data);
      });

      socket.on('message:delete', async (data) => {
        await this.handleMessageDelete(socket, data);
      });

      socket.on('message:react', async (data) => {
        await this.handleMessageReact(socket, data);
      });

      // Channel events
      socket.on('channel:join', async (data) => {
        await this.handleChannelJoin(socket, data);
      });

      socket.on('channel:leave', async (data) => {
        await this.handleChannelLeave(socket, data);
      });

      socket.on('channel:create', async (data) => {
        await this.handleChannelCreate(socket, data);
      });

      // Typing events
      socket.on('typing:start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing:stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Presence events
      socket.on('presence:update', (data) => {
        this.handlePresenceUpdate(socket, data);
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private trackUser(socket: AuthenticatedSocket): void {
    if (!socket.userId) return;

    if (!this.connectedUsers.has(socket.userId)) {
      this.connectedUsers.set(socket.userId, new Set());
    }
    
    this.connectedUsers.get(socket.userId)!.add(socket.id);
  }

  private trackCompanyUser(socket: AuthenticatedSocket): void {
    if (!socket.companyId) return;

    if (!this.companyRooms.has(socket.companyId)) {
      this.companyRooms.set(socket.companyId, new Set());
    }
    
    this.companyRooms.get(socket.companyId)!.add(socket.id);
  }

  private handleDisconnect(socket: AuthenticatedSocket): void {
    console.log(`User ${socket.userId} disconnected`);

    // Remove from tracking
    if (socket.userId) {
      const userSockets = this.connectedUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(socket.userId);
        }
      }
    }

    if (socket.companyId) {
      const companySockets = this.companyRooms.get(socket.companyId);
      if (companySockets) {
        companySockets.delete(socket.id);
        if (companySockets.size === 0) {
          this.companyRooms.delete(socket.companyId);
        }
      }
    }
  }

  // Message handlers
  private async handleMessageSend(socket: AuthenticatedSocket, data: any): Promise<void> {
    const { channelId, content, replyTo } = data;

    try {
      // Save message to database
      const message = await this.saveMessage({
        channelId: parseInt(channelId),
        senderId: socket.userId!,
        content,
        replyTo: replyTo ? parseInt(replyTo) : null,
      });

      // Broadcast to channel
      this.io.to(`channel-${channelId}`).emit('message:new', {
        ...message,
        sender: socket.user,
      });

      console.log(`Message sent in channel ${channelId} by user ${socket.userId}`);
    } catch (error) {
      console.error('Error handling message send:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleMessageEdit(socket: AuthenticatedSocket, data: any): Promise<void> {
    const { messageId, content } = data;

    try {
      // Update message in database
      const message = await this.updateMessage(messageId, content, socket.userId!);

      if (message) {
        // Broadcast to channel
        this.io.to(`channel-${message.channelId}`).emit('message:updated', message);
        console.log(`Message ${messageId} edited by user ${socket.userId}`);
      }
    } catch (error) {
      console.error('Error handling message edit:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  }

  private async handleMessageDelete(socket: AuthenticatedSocket, data: any): Promise<void> {
    const { messageId } = data;

    try {
      // Delete message from database
      const message = await this.deleteMessage(messageId, socket.userId!);

      if (message) {
        // Broadcast to channel
        this.io.to(`channel-${message.channelId}`).emit('message:deleted', {
          messageId,
        });
        console.log(`Message ${messageId} deleted by user ${socket.userId}`);
      }
    } catch (error) {
      console.error('Error handling message delete:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  }

  private async handleMessageReact(socket: AuthenticatedSocket, data: any): Promise<void> {
    const { messageId, emoji } = data;

    try {
      // Add reaction to database
      const reaction = await this.addReaction(messageId, emoji, socket.userId!);

      if (reaction) {
        // Broadcast to channel
        this.io.to(`channel-${reaction.message.channelId}`).emit('message:reaction', {
          messageId,
          emoji,
          userId: socket.userId,
          action: 'add',
        });
        console.log(`Reaction added to message ${messageId} by user ${socket.userId}`);
      }
    } catch (error) {
      console.error('Error handling message reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  }

  // Channel handlers
  private async handleChannelJoin(socket: AuthenticatedSocket, data: any): Promise<void> {
    const { channelId } = data;

    try {
      // Verify user can join channel
      const canJoin = await this.canUserJoinChannel(socket.userId!, channelId);
      
      if (!canJoin) {
        socket.emit('error', { message: 'Cannot join channel' });
        return;
      }

      socket.join(`channel-${channelId}`);
      
      // Notify channel members
      socket.to(`channel-${channelId}`).emit('user:joined', {
        channelId,
        user: socket.user,
      });

      console.log(`User ${socket.userId} joined channel ${channelId}`);
    } catch (error) {
      console.error('Error handling channel join:', error);
      socket.emit('error', { message: 'Failed to join channel' });
    }
  }

  private async handleChannelLeave(socket: AuthenticatedSocket, data: any): Promise<void> {
    const { channelId } = data;

    socket.leave(`channel-${channelId}`);
    
    // Notify channel members
    socket.to(`channel-${channelId}`).emit('user:left', {
      channelId,
      user: socket.user,
    });

    console.log(`User ${socket.userId} left channel ${channelId}`);
  }

  private async handleChannelCreate(socket: AuthenticatedSocket, data: any): Promise<void> {
    const { name, description, isPrivate } = data;

    try {
      // Create channel in database
      const channel = await this.createChannel({
        name,
        description,
        isPrivate: isPrivate || false,
        companyId: socket.companyId!,
        createdBy: socket.userId!,
      });

      // Join the new channel
      socket.join(`channel-${channel.id}`);

      // Broadcast to company
      this.io.to(`company-${socket.companyId}`).emit('channel:created', channel);

      console.log(`Channel ${channel.id} created by user ${socket.userId}`);
    } catch (error) {
      console.error('Error handling channel create:', error);
      socket.emit('error', { message: 'Failed to create channel' });
    }
  }

  // Typing handlers
  private handleTypingStart(socket: AuthenticatedSocket, data: any): void {
    const { channelId } = data;
    
    socket.to(`channel-${channelId}`).emit('typing:indicator', {
      channelId,
      user: socket.user,
      isTyping: true,
    });
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: any): void {
    const { channelId } = data;
    
    socket.to(`channel-${channelId}`).emit('typing:indicator', {
      channelId,
      user: socket.user,
      isTyping: false,
    });
  }

  // Presence handlers
  private handlePresenceUpdate(socket: AuthenticatedSocket, data: any): void {
    const { status } = data;
    
    // Broadcast presence update to company
    this.io.to(`company-${socket.companyId}`).emit('user:presence', {
      userId: socket.userId,
      status,
      lastSeen: new Date(),
    });
  }

  // Database methods (these would integrate with your existing Prisma models)
  private async saveMessage(data: any): Promise<any> {
    // This would use your existing Message model
    // For now, return mock data
    return {
      id: Math.random(),
      ...data,
      createdAt: new Date(),
    };
  }

  private async updateMessage(messageId: number, content: string, userId: number): Promise<any> {
    // This would update the message in your database
    return null;
  }

  private async deleteMessage(messageId: number, userId: number): Promise<any> {
    // This would delete the message from your database
    return null;
  }

  private async addReaction(messageId: number, emoji: string, userId: number): Promise<any> {
    // This would add a reaction to your database
    return null;
  }

  private async canUserJoinChannel(userId: number, channelId: number): Promise<boolean> {
    // This would check if the user can join the channel
    return true;
  }

  private async createChannel(data: any): Promise<any> {
    // This would create a channel in your database
    return {
      id: Math.random(),
      ...data,
      createdAt: new Date(),
    };
  }

  // Public methods for broadcasting domain events
  public broadcastDomainEvent(event: any): void {
    const { companyId, eventType, payload } = event;
    
    this.io.to(`company-${companyId}`).emit('domain:event', {
      eventType,
      payload,
      timestamp: new Date(),
    });
  }

  public getConnectedUsers(companyId: number): number {
    return this.companyRooms.get(companyId)?.size || 0;
  }

  public getTotalConnections(): number {
    return this.io.engine.clientsCount;
  }
}

export default SocketManager;