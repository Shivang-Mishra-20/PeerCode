import Redis, { RedisOptions } from 'ioredis';
import crypto from 'crypto';
import { CONFIG } from '../config/constants';

export const BACKEND_NODE_ID = `node-${crypto.randomUUID().slice(0, 8)}`;

export type RedisStatus = 'connected' | 'disconnected' | 'disabled' | 'reconnecting';

class RedisManager {
  private static instance: RedisManager;
  public redisPub: Redis | null = null;
  public redisSub: Redis | null = null;
  public redisClient: Redis | null = null;

  private status: RedisStatus = 'disconnected';
  private reconnectCount = 0;
  private lastReconnectAtISO: string | null = null;

  private constructor() {
    if (!CONFIG.ENABLE_REDIS) {
      console.log('[Redis] Redis is disabled via ENABLE_REDIS=false. Running in standalone mode.');
      this.status = 'disabled';
      return;
    }

    const options: RedisOptions = {
      host: CONFIG.REDIS_HOST,
      port: CONFIG.REDIS_PORT,
      password: CONFIG.REDIS_PASSWORD,
      lazyConnect: true,
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => {
        this.reconnectCount++;
        this.lastReconnectAtISO = new Date().toISOString();
        this.status = 'reconnecting';

        // Exponential backoff capped at 5000ms
        const delay = Math.min(100 * Math.pow(2, times - 1), 5000);
        console.warn(
          `[Redis] Connection lost. Reconnecting attempt #${times} in ${delay}ms... (nodeId: ${BACKEND_NODE_ID})`
        );
        return delay;
      },
    };

    this.redisPub = new Redis(options);
    this.redisSub = new Redis(options);
    this.redisClient = new Redis(options);

    this.attachEventListeners(this.redisPub, 'Publisher');
    this.attachEventListeners(this.redisSub, 'Subscriber');
    this.attachEventListeners(this.redisClient, 'Client');

    // Connect asynchronously
    this.initConnections();
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  private async initConnections(): Promise<void> {
    if (!CONFIG.ENABLE_REDIS) return;

    try {
      await Promise.all([
        this.redisPub?.connect(),
        this.redisSub?.connect(),
        this.redisClient?.connect(),
      ]);
      this.status = 'connected';
      console.log(
        `[Redis] Connected successfully to Redis at ${CONFIG.REDIS_HOST}:${CONFIG.REDIS_PORT} (nodeId: ${BACKEND_NODE_ID})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Redis] Initial connection attempt failed: ${msg}. Will retry in background.`);
    }
  }

  private attachEventListeners(client: Redis | null, label: string): void {
    if (!client) return;

    client.on('connect', () => {
      this.status = 'connected';
      console.log(`[Redis] ${label} connected`);
    });

    client.on('ready', () => {
      this.status = 'connected';
    });

    client.on('error', (err: Error) => {
      console.error(`[Redis] ${label} error:`, err.message);
    });

    client.on('close', () => {
      if (this.status !== 'disabled') {
        this.status = 'disconnected';
        console.warn(`[Redis] ${label} socket connection closed`);
      }
    });

    client.on('reconnecting', () => {
      this.status = 'reconnecting';
    });
  }

  public getStatus(): RedisStatus {
    return this.status;
  }

  public getMetrics() {
    return {
      status: this.status,
      enabled: CONFIG.ENABLE_REDIS,
      nodeId: BACKEND_NODE_ID,
      reconnectCount: this.reconnectCount,
      lastReconnectAt: this.lastReconnectAtISO,
    };
  }

  public async disconnectAll(): Promise<void> {
    if (!CONFIG.ENABLE_REDIS) return;

    console.log('[Redis] Closing all Redis connections...');
    this.status = 'disabled';
    try {
      await Promise.all([
        this.redisPub?.quit().catch(() => {}),
        this.redisSub?.quit().catch(() => {}),
        this.redisClient?.quit().catch(() => {}),
      ]);
      console.log('[Redis] All Redis connections closed gracefully.');
    } catch (err) {
      console.error('[Redis] Error during disconnect:', err);
    }
  }
}

export const redisManager = RedisManager.getInstance();
