// Socket server manager
import { WebSocketServer } from 'ws';

class SocketManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, any>();

  initialize(server: any) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      
      console.log(`Client connected: ${clientId}`);
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('Invalid message format:', error);
        }
      });
      
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      });
      
      ws.on('error', (error) => {
        console.error(`Client error (${clientId}):`, error);
        this.clients.delete(clientId);
      });
    });
  }

  private generateClientId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private handleMessage(clientId: string, data: any) {
    console.log(`Message from ${clientId}:`, data);
    
    // Echo message back to client
    const client = this.clients.get(clientId);
    if (client) {
      client.send(JSON.stringify({
        type: 'echo',
        data: data,
        timestamp: new Date().toISOString()
      }));
    }
  }

  broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(messageStr);
      }
    });
  }

  sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export default new SocketManager();
