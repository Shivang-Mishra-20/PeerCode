import { RoomSession } from './RoomSession';

export class RoomSessionManager {
  private static instance: RoomSessionManager;
  private sessions: Map<string, RoomSession>;

  private constructor() {
    this.sessions = new Map<string, RoomSession>();
  }

  public static getInstance(): RoomSessionManager {
    if (!RoomSessionManager.instance) {
      RoomSessionManager.instance = new RoomSessionManager();
    }
    return RoomSessionManager.instance;
  }

  /**
   * Retrieve existing RoomSession or instantiate new in-memory session
   */
  public getOrCreateSession(roomId: string, initialContent?: string): RoomSession {
    let session = this.sessions.get(roomId);
    if (!session) {
      session = new RoomSession(roomId, initialContent);
      this.sessions.set(roomId, session);
      console.log(`[RoomSessionManager] Created room session '${roomId}'`);
    }
    return session;
  }

  /**
   * Retrieve an active room session by ID
   */
  public getSession(roomId: string): RoomSession | undefined {
    return this.sessions.get(roomId);
  }

  /**
   * Remove and destroy an active room session
   */
  public removeSession(roomId: string): void {
    const session = this.sessions.get(roomId);
    if (session) {
      session.destroy();
      this.sessions.delete(roomId);
      console.log(`[RoomSessionManager] Removed room session '${roomId}'`);
    }
  }

  /**
   * Count total active room sessions in memory
   */
  public getActiveRoomCount(): number {
    return this.sessions.size;
  }

  /**
   * Count total connected WebSocket clients across all active rooms
   */
  public getConnectedClientCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      count += session.clients.size;
    }
    return count;
  }

  /**
   * Retrieve all active room sessions (for metrics and graceful shutdown)
   */
  public getAllSessions(): RoomSession[] {
    return Array.from(this.sessions.values());
  }
}

export const roomSessionManager = RoomSessionManager.getInstance();
