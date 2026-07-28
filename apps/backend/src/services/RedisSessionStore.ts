import { redisManager, BACKEND_NODE_ID } from '../lib/redis';
import { CONFIG } from '../config/constants';

export interface TransientSessionMetadata {
  roomId: string;
  backendNodeId: string;
  clientCount: number;
  createdAt: string;
  lastActivity: string;
}

export class RedisSessionStore {
  private static instance: RedisSessionStore;

  private constructor() {}

  public static getInstance(): RedisSessionStore {
    if (!RedisSessionStore.instance) {
      RedisSessionStore.instance = new RedisSessionStore();
    }
    return RedisSessionStore.instance;
  }

  private getKey(roomId: string): string {
    return `peercode:session:${roomId}`;
  }

  /**
   * Set or update transient session metadata in Redis with auto-expiring TTL
   */
  public async setSession(roomId: string, clientCount: number): Promise<void> {
    if (
      !CONFIG.ENABLE_REDIS ||
      !redisManager.redisClient ||
      redisManager.getStatus() !== 'connected'
    )
      return;

    try {
      const key = this.getKey(roomId);
      const now = new Date().toISOString();

      const existingData = await redisManager.redisClient.get(key);
      let createdAt = now;

      if (existingData) {
        try {
          const parsed = JSON.parse(existingData);
          if (parsed.createdAt) createdAt = parsed.createdAt;
        } catch {
          // Ignore fallback parsing error
        }
      }

      const metadata: TransientSessionMetadata = {
        roomId,
        backendNodeId: BACKEND_NODE_ID,
        clientCount,
        createdAt,
        lastActivity: now,
      };

      await redisManager.redisClient.setex(
        key,
        CONFIG.SESSION_TTL_SECONDS,
        JSON.stringify(metadata)
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[RedisSessionStore] Failed to update session '${roomId}': ${msg}`);
    }
  }

  /**
   * Get transient session metadata from Redis
   */
  public async getSession(roomId: string): Promise<TransientSessionMetadata | null> {
    if (
      !CONFIG.ENABLE_REDIS ||
      !redisManager.redisClient ||
      redisManager.getStatus() !== 'connected'
    )
      return null;

    try {
      const key = this.getKey(roomId);
      const data = await redisManager.redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as TransientSessionMetadata;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[RedisSessionStore] Failed to fetch session '${roomId}': ${msg}`);
      return null;
    }
  }

  /**
   * Delete transient session record from Redis upon room eviction
   */
  public async removeSession(roomId: string): Promise<void> {
    if (
      !CONFIG.ENABLE_REDIS ||
      !redisManager.redisClient ||
      redisManager.getStatus() !== 'connected'
    )
      return;

    try {
      const key = this.getKey(roomId);
      await redisManager.redisClient.del(key);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[RedisSessionStore] Failed to delete session '${roomId}': ${msg}`);
    }
  }

  /**
   * Count total transient active sessions stored across Redis cluster
   */
  public async getActiveSessionCount(): Promise<number> {
    if (
      !CONFIG.ENABLE_REDIS ||
      !redisManager.redisClient ||
      redisManager.getStatus() !== 'connected'
    )
      return 0;

    try {
      const keys = await redisManager.redisClient.keys('peercode:session:*');
      return keys.length;
    } catch {
      return 0;
    }
  }
}

export const redisSessionStore = RedisSessionStore.getInstance();
