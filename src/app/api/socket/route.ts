import { NextRequest } from "next/server";
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import SocketManager from "@/lib/socket/server";
import { logger } from "@/lib/logger";

// This will be used to initialize the Socket.io server
let socketManager: SocketManager | null = null;

export async function GET(request: NextRequest) {
  // This endpoint is used to initialize the Socket.io server
  // The actual WebSocket connection happens through the Socket.io client
  
  return new Response(JSON.stringify({
    message: "Socket.io server is running",
    status: "ready",
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// Initialize Socket.io server
export function initializeSocketServer(server: HTTPServer) {
  if (!socketManager) {
    socketManager = new SocketManager(server);
    logger.info("Socket.io server initialized", null, "Socket");
  }
  return socketManager;
}

// Get Socket.io server instance
export function getSocketManager(): SocketManager | null {
  return socketManager;
}