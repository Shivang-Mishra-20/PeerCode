import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import roomRoutes from './routes/roomRoutes';
import { setupWebSocketGateway } from './sockets/websocketGateway';
import { roomSessionManager } from './sockets/RoomSessionManager';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Enhanced service health & diagnostics endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'peercode-backend',
    activeRooms: roomSessionManager.getActiveRoomCount(),
    connectedClients: roomSessionManager.getConnectedClientCount(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// REST API Routes
app.use('/api/rooms', roomRoutes);

// Centralized error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Backend Error]:', err.stack || err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const server = http.createServer(app);
const wss = setupWebSocketGateway(server);

// Graceful shutdown handler for SIGINT / SIGTERM
const gracefulShutdown = (signal: string) => {
  console.log(`\n[PeerCode Backend] ${signal} received. Initiating graceful shutdown...`);

  // Close WebSocket Server
  wss.close(() => {
    console.log('[WebSocketGateway] Closed all WebSocket connections.');
  });

  // Destroy in-memory room sessions
  for (const session of roomSessionManager.getAllSessions()) {
    roomSessionManager.removeSession(session.id);
  }

  // Close HTTP Server
  server.close(() => {
    console.log('[PeerCode Backend] Server closed successfully.');
    process.exit(0);
  });

  // Force exit if server shutdown takes too long (5 seconds timeout)
  setTimeout(() => {
    console.error('[PeerCode Backend] Forced exit due to shutdown timeout.');
    process.exit(1);
  }, 5000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    console.log(`[PeerCode Backend] Server running on port ${port} (HTTP & WebSockets)`);
  });
}

export default app;
