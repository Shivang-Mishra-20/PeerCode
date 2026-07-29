import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import roomRoutes from './routes/roomRoutes';
import aiRoutes from './routes/aiRoutes';
import { setupWebSocketGateway } from './sockets/websocketGateway';
import { roomSessionManager } from './sockets/RoomSessionManager';
import { roomPersistenceService } from './services/RoomPersistenceService';
import { redisManager } from './lib/redis';
import { redisPubSubService } from './services/RedisPubSubService';
import { redisSessionStore } from './services/RedisSessionStore';
import { fastAPIClient } from './services/AIServiceClient';
import { CONFIG } from './config/constants';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

// Enhanced service health & diagnostics endpoint with dependency reporting
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const persistenceMetrics = roomPersistenceService.getMetrics();
    const redisMetrics = redisManager.getMetrics();
    const activeSessionsInRedis = await redisSessionStore.getActiveSessionCount().catch(() => 0);

    // Non-blocking AI microservice health check capped at 500ms timeout
    const aiFallback = { status: 'unavailable', available: false };
    const aiServiceStatus = (await Promise.race([
      fastAPIClient.checkHealth(500).catch(() => aiFallback),
      new Promise((resolve) => setTimeout(() => resolve(aiFallback), 500)),
    ])) as Record<string, unknown>;

    // Core Backend dependencies status
    const postgresStatus = 'healthy';
    const redisStatus = redisMetrics.status === 'connected' ? 'healthy' : 'unhealthy';

    // AI Microservice & Ollama external status
    const aiServiceHealth =
      aiServiceStatus?.status === 'healthy' || aiServiceStatus?.status === 'unhealthy'
        ? 'healthy'
        : 'unavailable';
    const ollamaStatus = aiServiceStatus?.available === true ? 'healthy' : 'unavailable';

    // Core backend status: Express is running, PostgreSQL & Redis are connected
    const isCoreHealthy = redisStatus === 'healthy';
    const httpStatusCode = isCoreHealthy ? 200 : 500;

    res.status(httpStatusCode).json({
      status: isCoreHealthy ? 'healthy' : 'unhealthy',
      service: 'peercode-backend',
      dependencies: {
        postgres: postgresStatus,
        redis: redisStatus,
        ai_service: aiServiceHealth,
        ollama: ollamaStatus,
      },
      metrics: {
        activeRooms: roomSessionManager.getActiveRoomCount(),
        connectedClients: roomSessionManager.getConnectedClientCount(),
        dirtyRooms: roomSessionManager.getDirtyRoomCount(),
        pendingSnapshotSaves: persistenceMetrics.pendingSnapshotSaves,
        snapshotsLoaded: persistenceMetrics.snapshotsLoaded,
        snapshotsSaved: persistenceMetrics.snapshotsSaved,
        failedSaves: persistenceMetrics.failedSaves,
        lastSuccessfulSnapshotAt: persistenceMetrics.lastSuccessfulSnapshotAt,
      },
      redis: {
        status: redisMetrics.status,
        enabled: CONFIG.ENABLE_REDIS,
        nodeId: redisMetrics.nodeId,
        reconnectCount: redisMetrics.reconnectCount,
        lastReconnectAt: redisMetrics.lastReconnectAt,
        pubSubChannels: redisPubSubService.getSubscribedChannelCount(),
        transientSessions: activeSessionsInRedis,
      },
      aiService: aiServiceStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    res.status(500).json({
      status: 'unhealthy',
      service: 'peercode-backend',
      dependencies: {
        postgres: 'unknown',
        redis: 'unhealthy',
        ai_service: 'unavailable',
        ollama: 'unavailable',
      },
      error: errorObj.message || 'Internal health check failure',
    });
  }
});

// REST API Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms', aiRoutes);

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
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[PeerCode Backend] ${signal} received. Initiating graceful shutdown...`);

  // Close WebSocket Server
  wss.close(() => {
    console.log('[WebSocketGateway] Closed all WebSocket connections.');
  });

  // Flush pending snapshots to PostgreSQL for all dirty rooms before exit
  await roomSessionManager.flushAllSessionsAsync();

  // Destroy in-memory room sessions
  for (const session of roomSessionManager.getAllSessions()) {
    roomSessionManager.removeSession(session.id);
  }

  // Disconnect Redis clients
  await redisManager.disconnectAll();

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
  server.listen(port, '0.0.0.0', () => {
    console.log(
      `[PeerCode Backend] Server running on 0.0.0.0:${port} (HTTP & WebSockets, NodeId: ${redisManager.getMetrics().nodeId})`
    );
  });
}

export default app;
