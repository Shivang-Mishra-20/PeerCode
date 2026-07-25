import { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export interface UseYjsOptions {
  roomId: string;
  userName?: string;
  userColor?: string;
  enabled?: boolean;
}

export interface AwarenessUser {
  clientId: number;
  name: string;
  color: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface UseYjsResult {
  yDoc: Y.Doc | null;
  yText: Y.Text | null;
  provider: WebsocketProvider | null;
  status: ConnectionStatus;
  awarenessUsers: AwarenessUser[];
}

const COLOR_PALETTE = ['#2f81f7', '#3fb950', '#a371f7', '#f85149', '#f0883e', '#79c0ff'];

const getRandomColor = (): string => {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
};

export const useYjs = ({
  roomId,
  userName = 'Anonymous Dev',
  userColor,
  enabled = true,
}: UseYjsOptions): UseYjsResult => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [awarenessUsers, setAwarenessUsers] = useState<AwarenessUser[]>([]);

  const yDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const assignedColorRef = useRef<string>(userColor || getRandomColor());

  useEffect(() => {
    if (!roomId || !enabled) {
      return;
    }

    // Idempotent cleanup of any pre-existing instances (React 18 Strict Mode safety)
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (yDocRef.current) {
      yDocRef.current.destroy();
      yDocRef.current = null;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_HOST || 'localhost:4000';
    const serverUrl = `${wsProtocol}//${wsHost}/ws/rooms`;

    setStatus('connecting');

    const doc = new Y.Doc();
    const provider = new WebsocketProvider(serverUrl, roomId, doc, {
      connect: true,
      maxBackoffTime: 10000,
    });

    yDocRef.current = doc;
    providerRef.current = provider;

    // Set local awareness user presence
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: assignedColorRef.current,
    });

    // Listen to connection status events accurately
    const handleStatus = (event: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      if (event.status === 'connected') {
        setStatus('connected');
      } else if (event.status === 'connecting') {
        setStatus('connecting');
      } else if (event.status === 'disconnected') {
        setStatus(provider.shouldConnect ? 'reconnecting' : 'disconnected');
      }
    };

    provider.on('status', handleStatus);

    // Listen to awareness updates
    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates();
      const users: AwarenessUser[] = [];

      states.forEach((state, clientId) => {
        if (state.user && typeof state.user.name === 'string') {
          users.push({
            clientId,
            name: state.user.name,
            color: state.user.color || '#2f81f7',
          });
        }
      });

      setAwarenessUsers(users);
    };

    provider.awareness.on('change', handleAwarenessChange);

    // Teardown return function
    return () => {
      provider.off('status', handleStatus);
      provider.awareness.off('change', handleAwarenessChange);
      provider.destroy();
      doc.destroy();

      yDocRef.current = null;
      providerRef.current = null;
      setStatus('disconnected');
      setAwarenessUsers([]);
    };
  }, [roomId, enabled, userName]);

  const yText = yDocRef.current ? yDocRef.current.getText('monaco') : null;

  return {
    yDoc: yDocRef.current,
    yText,
    provider: providerRef.current,
    status,
    awarenessUsers,
  };
};

export default useYjs;
