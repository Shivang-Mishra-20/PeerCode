import {
  CollaborationTransport,
  UpdateHandler,
  AwarenessHandler,
} from '../sockets/CollaborationTransport';
import { redisManager, BACKEND_NODE_ID } from '../lib/redis';
import { CONFIG } from '../config/constants';

interface PubSubMessageWrapper {
  nodeId: string;
  roomId: string;
  type: 'UPDATE' | 'AWARENESS';
  payloadBase64: string;
}

interface RoomCallbacks {
  onUpdate: UpdateHandler;
  onAwareness: AwarenessHandler;
}

export class RedisPubSubService implements CollaborationTransport {
  private static instance: RedisPubSubService;
  private activeSubscriptions: Map<string, RoomCallbacks>;

  private constructor() {
    this.activeSubscriptions = new Map<string, RoomCallbacks>();
    this.initMessageListener();
  }

  public static getInstance(): RedisPubSubService {
    if (!RedisPubSubService.instance) {
      RedisPubSubService.instance = new RedisPubSubService();
    }
    return RedisPubSubService.instance;
  }

  /**
   * Listen to incoming raw string messages on subscribed Redis channels
   */
  private initMessageListener(): void {
    if (!CONFIG.ENABLE_REDIS || !redisManager.redisSub) return;

    redisManager.redisSub.on('message', (channel: string, message: string) => {
      try {
        const wrapper: PubSubMessageWrapper = JSON.parse(message);

        // Echo loop prevention: ignore self-published messages
        if (wrapper.nodeId === BACKEND_NODE_ID) {
          return;
        }

        const callbacks = this.activeSubscriptions.get(wrapper.roomId);
        if (!callbacks) return;

        const binaryPayload = new Uint8Array(Buffer.from(wrapper.payloadBase64, 'base64'));

        if (wrapper.type === 'UPDATE') {
          callbacks.onUpdate(binaryPayload);
        } else if (wrapper.type === 'AWARENESS') {
          callbacks.onAwareness(binaryPayload);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[RedisPubSub] Error processing channel message on ${channel}: ${msg}`);
      }
    });

    // Restore subscriptions upon Redis reconnection
    redisManager.redisSub.on('ready', () => {
      if (this.activeSubscriptions.size > 0) {
        console.log(
          `[RedisPubSub] Redis connection restored. Resubscribing ${this.activeSubscriptions.size} rooms...`
        );
        for (const roomId of this.activeSubscriptions.keys()) {
          this.resubscribeChannels(roomId);
        }
      }
    });
  }

  private getChannels(roomId: string) {
    return {
      updatesChannel: `peercode:room:${roomId}:updates`,
      awarenessChannel: `peercode:room:${roomId}:awareness`,
    };
  }

  /**
   * Publish CRDT document binary update to Redis
   */
  public async publishUpdate(roomId: string, update: Uint8Array): Promise<void> {
    if (!CONFIG.ENABLE_REDIS || !redisManager.redisPub || redisManager.getStatus() !== 'connected')
      return;

    try {
      const { updatesChannel } = this.getChannels(roomId);
      const wrapper: PubSubMessageWrapper = {
        nodeId: BACKEND_NODE_ID,
        roomId,
        type: 'UPDATE',
        payloadBase64: Buffer.from(update).toString('base64'),
      };
      await redisManager.redisPub.publish(updatesChannel, JSON.stringify(wrapper));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[RedisPubSub] Failed to publish update for room '${roomId}': ${msg}`);
    }
  }

  /**
   * Publish live awareness presence update to Redis
   */
  public async publishAwareness(roomId: string, awarenessUpdate: Uint8Array): Promise<void> {
    if (!CONFIG.ENABLE_REDIS || !redisManager.redisPub || redisManager.getStatus() !== 'connected')
      return;

    try {
      const { awarenessChannel } = this.getChannels(roomId);
      const wrapper: PubSubMessageWrapper = {
        nodeId: BACKEND_NODE_ID,
        roomId,
        type: 'AWARENESS',
        payloadBase64: Buffer.from(awarenessUpdate).toString('base64'),
      };
      await redisManager.redisPub.publish(awarenessChannel, JSON.stringify(wrapper));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[RedisPubSub] Failed to publish awareness for room '${roomId}': ${msg}`);
    }
  }

  /**
   * Subscribe to Redis channels for a room when at least 1 local client exists
   */
  public async subscribeRoom(
    roomId: string,
    onUpdate: UpdateHandler,
    onAwareness: AwarenessHandler
  ): Promise<void> {
    this.activeSubscriptions.set(roomId, { onUpdate, onAwareness });

    if (!CONFIG.ENABLE_REDIS || !redisManager.redisSub || redisManager.getStatus() !== 'connected')
      return;

    await this.resubscribeChannels(roomId);
  }

  private async resubscribeChannels(roomId: string): Promise<void> {
    if (!CONFIG.ENABLE_REDIS || !redisManager.redisSub || redisManager.getStatus() !== 'connected')
      return;

    try {
      const { updatesChannel, awarenessChannel } = this.getChannels(roomId);
      await redisManager.redisSub.subscribe(updatesChannel, awarenessChannel);
      console.log(`[RedisPubSub] Subscribed to Redis channels for room '${roomId}'`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[RedisPubSub] Failed to subscribe to channels for room '${roomId}': ${msg}`);
    }
  }

  /**
   * Unsubscribe from Redis channels when 0 local clients remain or room is evicted
   */
  public async unsubscribeRoom(roomId: string): Promise<void> {
    this.activeSubscriptions.delete(roomId);

    if (!CONFIG.ENABLE_REDIS || !redisManager.redisSub || redisManager.getStatus() !== 'connected')
      return;

    try {
      const { updatesChannel, awarenessChannel } = this.getChannels(roomId);
      await redisManager.redisSub.unsubscribe(updatesChannel, awarenessChannel);
      console.log(`[RedisPubSub] Unsubscribed from Redis channels for room '${roomId}'`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[RedisPubSub] Failed to unsubscribe from channels for room '${roomId}': ${msg}`
      );
    }
  }

  public getSubscribedChannelCount(): number {
    return this.activeSubscriptions.size * 2;
  }
}

export const redisPubSubService = RedisPubSubService.getInstance();
