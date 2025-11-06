// Socket client utilities
export class SocketClient {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string) {
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log('Socket connected');
        this.reconnectAttempts = 0;
      };

      this.socket.onclose = () => {
        console.log('Socket disconnected');
        this.attemptReconnect(url);
      };

      this.socket.onerror = (error) => {
        console.error('Socket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect socket:', error);
    }
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(url);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const socketClient = new SocketClient();

// Helper functions for socket operations
export function onSocketEvent(event: string, callback: (...args: any[]) => void) {
  // Add event listener wrapper
  if (socketClient) {
    // Implementation depends on your socket library
    // For now, this is a placeholder
    console.log('onSocketEvent:', event);
  }
}

export function offSocketEvent(event: string, callback: (...args: any[]) => void) {
  // Remove event listener wrapper
  if (socketClient) {
    console.log('offSocketEvent:', event);
  }
}

export function sendMessage(channel: string, message: any) {
  socketClient.send({ type: 'message', channel, data: message });
}

export function joinChannel(channel: string) {
  socketClient.send({ type: 'join', channel });
}

export function leaveChannel(channel: string) {
  socketClient.send({ type: 'leave', channel });
}

export function startTyping(channel: string) {
  socketClient.send({ type: 'typing', channel, action: 'start' });
}

export function stopTyping(channel: string) {
  socketClient.send({ type: 'typing', channel, action: 'stop' });
}

