import { WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { roomPersistenceService } from '../services/RoomPersistenceService';
import { CollaborationTransport } from './CollaborationTransport';
import { redisPubSubService } from '../services/RedisPubSubService';
import { redisSessionStore } from '../services/RedisSessionStore';
import { CONFIG } from '../config/constants';

export const MESSAGE_SYNC = 0;
export const MESSAGE_AWARENESS = 1;
const ORIGIN_REDIS_REMOTE = 'REDIS_REMOTE';

export class RoomSession {
  public id: string;
  public doc: Y.Doc;
  public awareness: awarenessProtocol.Awareness;
  public clients: Set<WebSocket>;
  public clientAwarenessIDs: Map<WebSocket, Set<number>>;
  public isDirty: boolean;
  public destroyTimeout: NodeJS.Timeout | null = null;
  public onIdleEvict?: (roomId: string) => void;
  private transport: CollaborationTransport;

  constructor(
    id: string,
    initialContent?: string,
    transport: CollaborationTransport = redisPubSubService
  ) {
    this.id = id;
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.clients = new Set<WebSocket>();
    this.clientAwarenessIDs = new Map<WebSocket, Set<number>>();
    this.isDirty = false;
    this.transport = transport;

    // Seed initial content if provided (legacy hydration fallback)
    if (initialContent) {
      const yText = this.doc.getText('monaco');
      yText.insert(0, initialContent);
    }

    // Subscribe to remote transport messages across nodes
    this.transport.subscribeRoom(
      this.id,
      (update: Uint8Array) => this.handleRemoteUpdate(update),
      (awarenessUpdate: Uint8Array) => this.handleRemoteAwareness(awarenessUpdate)
    );

    // Listen to document update events
    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      roomPersistenceService.scheduleDebouncedSave(this);

      // Local WebSocket broadcast
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      this.broadcast(encoding.toUint8Array(encoder), origin as WebSocket);

      // Publish to distributed transport if update originated locally
      if (origin !== ORIGIN_REDIS_REMOTE) {
        this.transport.publishUpdate(this.id, update);
      }
    });

    // Listen to awareness update events (presence & cursors)
    this.awareness.on(
      'update',
      (
        { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown
      ) => {
        const ws = origin as WebSocket;
        if (ws && this.clientAwarenessIDs.has(ws)) {
          const socketIDs = this.clientAwarenessIDs.get(ws);
          if (socketIDs) {
            added.forEach((id: number) => socketIDs.add(id));
            updated.forEach((id: number) => socketIDs.add(id));
            removed.forEach((id: number) => socketIDs.delete(id));
          }
        }

        const changedClients = added.concat(updated, removed);
        const encodedAwareness = awarenessProtocol.encodeAwarenessUpdate(
          this.awareness,
          changedClients
        );

        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(encoder, encodedAwareness);
        this.broadcast(encoding.toUint8Array(encoder), ws);

        // Publish to distributed transport if awareness originated locally
        if (origin !== ORIGIN_REDIS_REMOTE) {
          this.transport.publishAwareness(this.id, encodedAwareness);
        }
      }
    );
  }

  /**
   * Apply remote CRDT update received from another backend node via transport
   */
  private handleRemoteUpdate(update: Uint8Array): void {
    try {
      Y.applyUpdate(this.doc, update, ORIGIN_REDIS_REMOTE);
    } catch (err) {
      console.error(`[RoomSession:${this.id}] Error applying remote CRDT update:`, err);
    }
  }

  /**
   * Apply remote awareness update received from another backend node via transport
   */
  private handleRemoteAwareness(awarenessUpdate: Uint8Array): void {
    try {
      awarenessProtocol.applyAwarenessUpdate(this.awareness, awarenessUpdate, ORIGIN_REDIS_REMOTE);
    } catch (err) {
      console.error(`[RoomSession:${this.id}] Error applying remote awareness:`, err);
    }
  }

  /**
   * Reusable broadcast helper to transmit binary buffers to all local room sockets
   */
  private broadcast(buffer: Uint8Array, except?: WebSocket): void {
    for (const client of this.clients) {
      if (client !== except && client.readyState === WebSocket.OPEN) {
        client.send(buffer);
      }
    }
  }

  /**
   * Add a new WebSocket client to this room session
   */
  public addClient(ws: WebSocket): void {
    this.clients.add(ws);
    this.clientAwarenessIDs.set(ws, new Set<number>());

    // Cancel idle destroy timeout if room was idling
    if (this.destroyTimeout) {
      clearTimeout(this.destroyTimeout);
      this.destroyTimeout = null;
    }

    // Update transient session in Redis
    redisSessionStore.setSession(this.id, this.clients.size);

    // Send initial Yjs Sync Step 1 to new client
    this.sendSyncStep1(ws);

    // Send current awareness states to new client
    if (this.awareness.getStates().size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          this.awareness,
          Array.from(this.awareness.getStates().keys())
        )
      );
      ws.send(encoding.toUint8Array(encoder));
    }
  }

  /**
   * Remove a WebSocket client from this room session and clean up awareness
   */
  public removeClient(ws: WebSocket): void {
    this.clients.delete(ws);
    const clientIDs = this.clientAwarenessIDs.get(ws);
    if (clientIDs && clientIDs.size > 0) {
      awarenessProtocol.removeAwarenessStates(this.awareness, Array.from(clientIDs), null);
    }
    this.clientAwarenessIDs.delete(ws);

    // Update transient session in Redis
    redisSessionStore.setSession(this.id, this.clients.size);

    // If last client disconnected, flush pending save immediately and schedule 60s idle eviction
    if (this.clients.size === 0) {
      roomPersistenceService.flushPendingSave(this, 'Flush on disconnect');

      if (this.destroyTimeout) {
        clearTimeout(this.destroyTimeout);
      }
      this.destroyTimeout = setTimeout(() => {
        console.log(`[Persistence] Room evicted '${this.id}'`);
        if (this.onIdleEvict) {
          this.onIdleEvict(this.id);
        }
      }, CONFIG.ROOM_IDLE_TIMEOUT_MS);
    }
  }

  /**
   * Send Yjs Sync Step 1 (Vector Clock) to a client
   */
  private sendSyncStep1(ws: WebSocket): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, this.doc);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(encoding.toUint8Array(encoder));
    }
  }

  /**
   * Handle incoming raw binary buffer from client
   */
  public handleMessage(ws: WebSocket, message: Uint8Array): void {
    try {
      const decoder = decoding.createDecoder(message);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, this.doc, ws);
          if (encoding.length(encoder) > 1) {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(encoding.toUint8Array(encoder));
            }
          }
          break;
        }
        case MESSAGE_AWARENESS: {
          awarenessProtocol.applyAwarenessUpdate(
            this.awareness,
            decoding.readVarUint8Array(decoder),
            ws
          );
          break;
        }
        default:
          console.warn(`[RoomSession:${this.id}] Unknown message type: ${messageType}`);
      }
    } catch (err) {
      console.error(`[RoomSession:${this.id}] Error handling binary message:`, err);
    }
  }

  /**
   * Destroy in-memory room session resources and unsubscribe from transport
   */
  public destroy(): void {
    if (this.destroyTimeout) {
      clearTimeout(this.destroyTimeout);
      this.destroyTimeout = null;
    }

    // Unsubscribe from Redis pub/sub transport
    this.transport.unsubscribeRoom(this.id);
    redisSessionStore.removeSession(this.id);

    this.awareness.destroy();
    this.doc.destroy();
    this.clients.clear();
    this.clientAwarenessIDs.clear();
  }
}
