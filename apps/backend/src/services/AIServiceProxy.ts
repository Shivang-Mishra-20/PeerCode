import { Request, Response } from 'express';
import crypto from 'crypto';
import { roomSessionManager } from '../sockets/RoomSessionManager';
import { AIServiceClient, fastAPIClient } from './AIServiceClient';

export class AIServiceProxy {
  private client: AIServiceClient;

  constructor(client: AIServiceClient = fastAPIClient) {
    this.client = client;
  }

  public async handleGenerateRequest(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const roomId = req.params.roomId;
    const body = req.body || {};

    const requestId =
      (req.headers['x-request-id'] as string) ||
      body.request_id ||
      `req-${crypto.randomUUID().slice(0, 8)}`;

    const operation = body.operation || 'review';

    // 1. Explicit Priority Code Source Resolution
    let codeToUse = body.code;

    if (!codeToUse || typeof codeToUse !== 'string' || codeToUse.trim().length === 0) {
      // Resolve code context from active Yjs RoomSession
      const session = await roomSessionManager.getOrCreateSessionAsync(roomId);
      if (session) {
        codeToUse = session.doc.getText('monaco').toString();
      }
    }

    // Strict validation: Reject HTTP 400 if code is missing/empty before calling FastAPI
    if (!codeToUse || codeToUse.trim().length === 0) {
      const durationMs = Date.now() - startTime;
      console.warn(
        `[AI Proxy] requestId=${requestId} roomId=${roomId} operation=${operation} durationMs=${durationMs} status=400_EMPTY_CODE`
      );
      res.status(400).json({
        error: 'Bad Request',
        message:
          'Source code payload or active Yjs room document is empty. Please provide code or type in Monaco editor.',
        requestId,
      });
      return;
    }

    const aiPayload = {
      ...body,
      code: codeToUse,
      request_id: requestId,
    };

    const abortController = new AbortController();

    // Monitor client disconnect to trigger cancellation
    req.on('close', () => {
      if (!res.writableEnded) {
        console.log(
          `[AI Proxy] requestId=${requestId} roomId=${roomId} operation=${operation} status=CLIENT_DISCONNECTED_ABORT`
        );
        abortController.abort();
      }
    });

    try {
      const upstreamStream = await this.client.generateStream(
        aiPayload,
        { 'x-request-id': requestId },
        abortController.signal
      );

      // Set Production Reverse-Proxy SSE Headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'x-request-id': requestId,
      });

      // Transparently pipe ALL SSE events from upstream to client
      const reader = upstreamStream.getReader();
      const decoder = new TextDecoder();

      let isStreaming = true;
      while (isStreaming) {
        const { done, value } = await reader.read();
        if (done) {
          isStreaming = false;
          break;
        }
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      }

      res.end();
      const durationMs = Date.now() - startTime;
      console.log(
        `[AI Proxy] requestId=${requestId} roomId=${roomId} operation=${operation} durationMs=${durationMs} status=200_SUCCESS`
      );
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const errorObj = err instanceof Error ? err : new Error(String(err));

      if (errorObj.name === 'AbortError' || abortController.signal.aborted) {
        console.warn(
          `[AI Proxy] requestId=${requestId} roomId=${roomId} operation=${operation} durationMs=${durationMs} status=ABORTED`
        );
        return;
      }

      console.error(
        `[AI Proxy] requestId=${requestId} roomId=${roomId} operation=${operation} durationMs=${durationMs} status=503_ERROR: ${errorObj.message}`
      );

      // If headers not yet sent, send SSE error event format
      if (!res.headersSent) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
          'x-request-id': requestId,
        });
      }

      const errorEvent = `event: error\ndata: ${JSON.stringify({
        message: errorObj.message || 'AI service request failed',
        requestId,
      })}\n\n`;

      res.write(errorEvent);
      res.end();
    }
  }
}

export const aiServiceProxy = new AIServiceProxy();
