import { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { parse } from 'url';
import { roomSessionManager } from './RoomSessionManager';

export const setupWebSocketGateway = (server: HttpServer): WebSocketServer => {
  const wss = new WebSocketServer({ noServer: true });

  // Heartbeat ping/pong interval (30 seconds)
  const heartbeatInterval = setInterval(() => {
    for (const session of roomSessionManager.getAllSessions()) {
      for (const client of session.clients) {
        if ((client as WebSocket & { isAlive?: boolean }).isAlive === false) {
          console.log(`[WebSocketGateway] Terminating dead client in room '${session.id}'`);
          session.removeClient(client);
          client.terminate();
          continue;
        }

        (client as WebSocket & { isAlive?: boolean }).isAlive = false;
        client.ping();
      }
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // Intercept HTTP upgrade requests matching /ws/rooms/:roomId
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '', true);

    if (pathname && pathname.startsWith('/ws/rooms/')) {
      const roomId = pathname.replace('/ws/rooms/', '').trim();

      if (!roomId) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, roomId);
      });
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
    }
  });

  // Handle WebSocket Connection
  wss.on(
    'connection',
    (ws: WebSocket & { isAlive?: boolean }, _request: IncomingMessage, roomId: string) => {
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      const session = roomSessionManager.getOrCreateSession(roomId);
      session.addClient(ws);

      console.log(
        `[WebSocketGateway] Client connected to room '${roomId}'. Total clients in room: ${session.clients.size}`
      );

      ws.on('message', (data: RawData, isBinary: boolean) => {
        if (isBinary || data instanceof Uint8Array || Buffer.isBuffer(data)) {
          const uint8Array = new Uint8Array(data as Buffer);
          session.handleMessage(ws, uint8Array);
        }
      });

      ws.on('close', (code, reason) => {
        console.log(
          `[WebSocketGateway] Client disconnected from room '${roomId}' (code ${code}, reason: ${reason.toString() || 'none'}). Remaining clients: ${session.clients.size - 1}`
        );
        session.removeClient(ws);
      });

      ws.on('error', (err) => {
        console.error(`[WebSocketGateway] Socket error in room '${roomId}':`, err.message);
        session.removeClient(ws);
      });
    }
  );

  return wss;
};
