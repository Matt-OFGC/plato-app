// Socket.io client wrapper for real-time communication
// Handles connection, authentication, and event management

import { io, Socket } from 'socket.io-client';

interface SocketEvents {
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
  
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: Error) => void;
}

class SocketClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      return true;
    }

    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
      
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 20000,
      });

      this.setupSocketEventListeners();
      
      return new Promise((resolve) => {
        this.socket!.on('connect', () => {
          console.log('Socket.io connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          console.error('Socket.io connection error:', error);
          this.isConnected = false;
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Failed to connect to Socket.io:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Message methods
  sendMessage(channelId: number, content: string, replyTo?: number): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot send message');
      return;
    }

    this.socket.emit('message:send', {
      channelId,
      content,
      replyTo,
    });
  }

  editMessage(messageId: number, content: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot edit message');
      return;
    }

    this.socket.emit('message:edit', {
      messageId,
      content,
    });
  }

  deleteMessage(messageId: number): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot delete message');
      return;
    }

    this.socket.emit('message:delete', {
      messageId,
    });
  }

  reactToMessage(messageId: number, emoji: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot react to message');
      return;
    }

    this.socket.emit('message:react', {
      messageId,
      emoji,
    });
  }

  // Channel methods
  joinChannel(channelId: number): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join channel');
      return;
    }

    this.socket.emit('channel:join', { channelId });
  }

  leaveChannel(channelId: number): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot leave channel');
      return;
    }

    this.socket.emit('channel:leave', { channelId });
  }

  createChannel(name: string, description?: string, isPrivate?: boolean): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot create channel');
      return;
    }

    this.socket.emit('channel:create', {
      name,
      description,
      isPrivate,
    });
  }

  // Typing methods
  startTyping(channelId: number): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing:start', { channelId });
  }

  stopTyping(channelId: number): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing:stop', { channelId });
  }

  // Presence methods
  updatePresence(status: 'online' | 'away' | 'busy'): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('presence:update', { status });
  }

  // Event listener methods
  on<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)!.push(listener);
    
    if (this.socket) {
      this.socket.on(event as string, listener as any);
    }
  }

  off<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    
    if (this.socket) {
      this.socket.off(event as string, listener as any);
    }
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  private setupEventListeners(): void {
    // Handle page visibility changes
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.updatePresence('away');
        } else {
          this.updatePresence('online');
        }
      });

      // Handle online/offline status
      window.addEventListener('online', () => {
        this.connect();
      });

      window.addEventListener('offline', () => {
        this.disconnect();
      });
    }
  }

  private setupSocketEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.io connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Re-register all event listeners
      for (const [event, listeners] of this.eventListeners) {
        for (const listener of listeners) {
          this.socket!.on(event, listener as any);
        }
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
    });

    this.socket.on('error', (data) => {
      console.error('Socket.io error:', data);
    });
  }
}

// Export singleton instance
export const socketClient = new SocketClient();

// Utility functions
export async function connectSocket(): Promise<boolean> {
  return await socketClient.connect();
}

export function disconnectSocket(): void {
  socketClient.disconnect();
}

export function isSocketConnected(): boolean {
  return socketClient.isSocketConnected();
}

// Message utilities
export function sendMessage(channelId: number, content: string, replyTo?: number): void {
  socketClient.sendMessage(channelId, content, replyTo);
}

export function editMessage(messageId: number, content: string): void {
  socketClient.editMessage(messageId, content);
}

export function deleteMessage(messageId: number): void {
  socketClient.deleteMessage(messageId);
}

export function reactToMessage(messageId: number, emoji: string): void {
  socketClient.reactToMessage(messageId, emoji);
}

// Channel utilities
export function joinChannel(channelId: number): void {
  socketClient.joinChannel(channelId);
}

export function leaveChannel(channelId: number): void {
  socketClient.leaveChannel(channelId);
}

export function createChannel(name: string, description?: string, isPrivate?: boolean): void {
  socketClient.createChannel(name, description, isPrivate);
}

// Typing utilities
export function startTyping(channelId: number): void {
  socketClient.startTyping(channelId);
}

export function stopTyping(channelId: number): void {
  socketClient.stopTyping(channelId);
}

// Event listener utilities
export function onSocketEvent<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
  socketClient.on(event, listener);
}

export function offSocketEvent<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
  socketClient.off(event, listener);
}

// Auto-connect on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    connectSocket();
  });
}


