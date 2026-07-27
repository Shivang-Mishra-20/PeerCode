import * as Y from 'yjs';
import { saveSnapshot, getLatestSnapshot } from './roomService';
import { RoomSession } from '../sockets/RoomSession';
import { CONFIG } from '../config/constants';

export interface PersistenceMetrics {
  pendingSnapshotSaves: number;
  snapshotsLoaded: number;
  snapshotsSaved: number;
  failedSaves: number;
  lastSuccessfulSnapshotAt: string | null;
}

export class RoomPersistenceService {
  private static instance: RoomPersistenceService;
  private pendingDebounceTimers: Map<string, NodeJS.Timeout>;
  private pendingRetryTimers: Map<string, NodeJS.Timeout>;

  // Metrics
  private snapshotsLoadedCount = 0;
  private snapshotsSavedCount = 0;
  private failedSavesCount = 0;
  private lastSuccessfulSnapshotAtISO: string | null = null;

  private constructor() {
    this.pendingDebounceTimers = new Map<string, NodeJS.Timeout>();
    this.pendingRetryTimers = new Map<string, NodeJS.Timeout>();
  }

  public static getInstance(): RoomPersistenceService {
    if (!RoomPersistenceService.instance) {
      RoomPersistenceService.instance = new RoomPersistenceService();
    }
    return RoomPersistenceService.instance;
  }

  /**
   * Hydrate Y.Doc content from latest database snapshot.
   * Backward compatible: uses binary stateBytes if available, falls back to plain text content.
   */
  public async hydrateRoomState(session: RoomSession): Promise<void> {
    try {
      const snapshot = await getLatestSnapshot(session.id);
      if (snapshot) {
        if (snapshot.stateBytes && snapshot.stateBytes.length > 0) {
          Y.applyUpdate(session.doc, snapshot.stateBytes);
          console.log(`[Persistence] Hydrated room '${session.id}' from binary stateBytes`);
        } else if (snapshot.content) {
          const yText = session.doc.getText('monaco');
          yText.insert(0, snapshot.content);
          console.log(`[Persistence] Hydrated room '${session.id}' from plain text fallback`);
        }
        this.snapshotsLoadedCount++;
      } else {
        console.log(`[Persistence] No previous snapshot found for room '${session.id}'`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Persistence] Failed to hydrate room '${session.id}' from database: ${msg}`);
    }
  }

  /**
   * Schedule a debounced background snapshot save (10s idle)
   */
  public scheduleDebouncedSave(session: RoomSession): void {
    session.isDirty = true;

    // Clear existing debounce timer for this room if active
    const existingDebounce = this.pendingDebounceTimers.get(session.id);
    if (existingDebounce) {
      clearTimeout(existingDebounce);
    }

    const timer = setTimeout(() => {
      this.pendingDebounceTimers.delete(session.id);
      this.executeSave(session, 1);
    }, CONFIG.SNAPSHOT_DEBOUNCE_MS);

    this.pendingDebounceTimers.set(session.id, timer);
  }

  /**
   * Flush pending save immediately (e.g. last socket disconnect or shutdown)
   */
  public async flushPendingSave(session: RoomSession, reason: string): Promise<void> {
    const existingDebounce = this.pendingDebounceTimers.get(session.id);
    if (existingDebounce) {
      clearTimeout(existingDebounce);
      this.pendingDebounceTimers.delete(session.id);
    }

    if (session.isDirty) {
      console.log(`[Persistence] ${reason} for room '${session.id}'`);
      await this.executeSave(session, 1);
    }
  }

  /**
   * Execute snapshot write to PostgreSQL with exponential backoff retry on failure
   */
  private async executeSave(session: RoomSession, attempt: number): Promise<void> {
    if (!session.isDirty) {
      return;
    }

    try {
      const stateBytes = Y.encodeStateAsUpdate(session.doc);
      const content = session.doc.getText('monaco').toString();

      await saveSnapshot(session.id, {
        content,
        stateBytes,
      });

      // DO NOT clear isDirty until successful write!
      session.isDirty = false;
      this.snapshotsSavedCount++;
      this.lastSuccessfulSnapshotAtISO = new Date().toISOString();

      // Clear any pending retry timer for this room
      const existingRetry = this.pendingRetryTimers.get(session.id);
      if (existingRetry) {
        clearTimeout(existingRetry);
        this.pendingRetryTimers.delete(session.id);
      }

      console.log(`[Persistence] Snapshot saved for room '${session.id}'`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.failedSavesCount++;
      console.error(
        `[Persistence] Failed to save snapshot for room '${session.id}' (Attempt ${attempt}/${CONFIG.MAX_SAVE_RETRIES}): ${msg}`
      );

      // Exponential Backoff Retry Strategy (5s -> 10s -> 20s)
      if (attempt <= CONFIG.MAX_SAVE_RETRIES) {
        const backoffMs = CONFIG.INITIAL_SAVE_RETRY_INTERVAL_MS * Math.pow(2, attempt - 1);
        console.log(
          `[Persistence] Retry scheduled for room '${session.id}' (Attempt ${attempt}/${CONFIG.MAX_SAVE_RETRIES}) in ${backoffMs}ms`
        );

        const retryTimer = setTimeout(() => {
          this.pendingRetryTimers.delete(session.id);
          this.executeSave(session, attempt + 1);
        }, backoffMs);

        this.pendingRetryTimers.set(session.id, retryTimer);
      } else {
        console.error(
          `[Persistence] Max save retries reached for room '${session.id}'. Room remains dirty in memory for next save attempt.`
        );
      }
    }
  }

  /**
   * Flush all dirty sessions during server graceful shutdown
   */
  public async flushAll(sessions: RoomSession[]): Promise<void> {
    console.log(`[Persistence] Flush on shutdown for ${sessions.length} room sessions`);
    const promises: Promise<void>[] = [];
    for (const session of sessions) {
      if (session.isDirty) {
        promises.push(this.flushPendingSave(session, 'Flush on shutdown'));
      }
    }
    await Promise.all(promises);
  }

  /**
   * Get metrics for /health diagnostics endpoint
   */
  public getMetrics(): PersistenceMetrics {
    return {
      pendingSnapshotSaves: this.pendingDebounceTimers.size + this.pendingRetryTimers.size,
      snapshotsLoaded: this.snapshotsLoadedCount,
      snapshotsSaved: this.snapshotsSavedCount,
      failedSaves: this.failedSavesCount,
      lastSuccessfulSnapshotAt: this.lastSuccessfulSnapshotAtISO,
    };
  }
}

export const roomPersistenceService = RoomPersistenceService.getInstance();
