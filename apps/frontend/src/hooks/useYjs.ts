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

const injectAwarenessStyles = (
  states: Map<number, { user?: { name?: string; color?: string } }>
) => {
  let styleEl = document.getElementById('yjs-awareness-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'yjs-awareness-styles';
    document.head.appendChild(styleEl);
  }

  let css = '';
  states.forEach((state, clientId) => {
    if (state.user && state.user.color) {
      const color = state.user.color;
      const name = state.user.name || 'Collaborator';
      css += `
        .yRemoteSelection-${clientId} {
          background-color: ${color}33 !important;
        }
        .yRemoteSelectionHead-${clientId} {
          border-color: ${color} !important;
        }
        .yRemoteSelectionHead-${clientId}::after {
          content: '${name}';
          background-color: ${color} !important;
        }
      `;
    }
  });

  styleEl.textContent = css;
};

export const useYjs = ({
  roomId,
  userName = 'Anonymous Dev',
  userColor,
  enabled = true,
}: UseYjsOptions): UseYjsResult => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [awarenessUsers, setAwarenessUsers] = useState<AwarenessUser[]>([]);
  const [instances, setInstances] = useState<{
    doc: Y.Doc | null;
    provider: WebsocketProvider | null;
    yText: Y.Text | null;
  }>({
    doc: null,
    provider: null,
    yText: null,
  });

  const assignedColorRef = useRef<string>(userColor || getRandomColor());

  // Instantiate Y.Doc & WebsocketProvider ONLY when roomId or enabled status changes
  useEffect(() => {
    if (!roomId || !enabled) {
      return;
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
    const yText = doc.getText('monaco');

    setInstances({ doc, provider, yText });

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

      injectAwarenessStyles(states);
      setAwarenessUsers(users);
    };

    provider.awareness.on('change', handleAwarenessChange);

    return () => {
      provider.off('status', handleStatus);
      provider.awareness.off('change', handleAwarenessChange);
      provider.destroy();
      doc.destroy();

      setInstances({ doc: null, provider: null, yText: null });
      setStatus('disconnected');
      setAwarenessUsers([]);
    };
  }, [roomId, enabled]);

  // Update local awareness presence fields without re-creating provider
  useEffect(() => {
    if (instances.provider) {
      instances.provider.awareness.setLocalStateField('user', {
        name: userName,
        color: assignedColorRef.current,
      });
    }
  }, [instances.provider, userName]);

  return {
    yDoc: instances.doc,
    yText: instances.yText,
    provider: instances.provider,
    status,
    awarenessUsers,
  };
};

export default useYjs;
