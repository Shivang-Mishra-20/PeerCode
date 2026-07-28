export type UpdateHandler = (update: Uint8Array) => void;
export type AwarenessHandler = (awareness: Uint8Array) => void;

export interface CollaborationTransport {
  publishUpdate(roomId: string, update: Uint8Array): Promise<void>;
  publishAwareness(roomId: string, awarenessUpdate: Uint8Array): Promise<void>;
  subscribeRoom(
    roomId: string,
    onUpdate: UpdateHandler,
    onAwareness: AwarenessHandler
  ): Promise<void>;
  unsubscribeRoom(roomId: string): Promise<void>;
}
