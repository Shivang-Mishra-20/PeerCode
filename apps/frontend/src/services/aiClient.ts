import { AIGenerateResponse, AIOperation } from '../types/ai';

export const TOKEN_FLUSH_INTERVAL_MS = 40;

export interface StreamAIOptions {
  roomId: string;
  operation: AIOperation;
  code?: string;
  language?: string;
  scope?: 'full_file' | 'selection';
  selection?: { start_line: number; end_line: number };
  conversation?: Array<{ role: string; content: string }>;
  requestId?: string;
  signal?: AbortSignal;
  onStatus?: (stage: string, requestId: string) => void;
  onTokenChunk?: (accumulatedText: string) => void;
  onComplete?: (response: AIGenerateResponse) => void;
  onError?: (error: { message: string; requestId?: string }) => void;
}

export class AIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public async generateStream(options: StreamAIOptions): Promise<void> {
    const {
      roomId,
      operation,
      code,
      language,
      scope,
      selection,
      conversation,
      requestId,
      signal,
      onStatus,
      onTokenChunk,
      onComplete,
      onError,
    } = options;

    const url = `${this.baseUrl}/api/rooms/${roomId}/ai/generate`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (requestId) {
      headers['x-request-id'] = requestId;
    }

    const payload = {
      operation,
      code,
      language,
      scope,
      selection,
      conversation,
      request_id: requestId,
    };

    let tokenBuffer = '';
    let flushTimer: NodeJS.Timeout | null = null;

    const startFlushLoop = () => {
      if (flushTimer) return;
      flushTimer = setInterval(() => {
        if (tokenBuffer && onTokenChunk) {
          onTokenChunk(tokenBuffer);
        }
      }, TOKEN_FLUSH_INTERVAL_MS);
    };

    const stopFlushLoop = () => {
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }
      if (tokenBuffer && onTokenChunk) {
        onTokenChunk(tokenBuffer);
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(
          errJson.message || `AI gateway request failed with HTTP ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error('AI gateway returned empty response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      startFlushLoop();

      let isReading = true;
      while (isReading) {
        const { done, value } = await reader.read();
        if (done) {
          isReading = false;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace('event:', '').trim();
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace('data:', '').trim();
            try {
              const data = JSON.parse(dataStr);

              if (currentEvent === 'status' && onStatus) {
                onStatus(data.stage || 'generating', data.requestId || requestId);
              } else if (currentEvent === 'token') {
                if (data.text) {
                  tokenBuffer += data.text;
                }
              } else if (currentEvent === 'complete') {
                stopFlushLoop();
                if (onComplete) {
                  onComplete(data as AIGenerateResponse);
                }
              } else if (currentEvent === 'error') {
                stopFlushLoop();
                if (onError) {
                  onError({
                    message: data.message || 'AI analysis error',
                    requestId: data.requestId,
                  });
                }
              }
            } catch {
              // Ignore non-JSON parsing errors
            }
          }
        }
      }

      stopFlushLoop();
    } catch (err: unknown) {
      stopFlushLoop();
      const errorObj = err instanceof Error ? err : new Error(String(err));
      if (errorObj.name === 'AbortError') {
        return;
      }
      if (onError) {
        onError({ message: errorObj.message || 'Stream connection error', requestId });
      }
    }
  }
}

export const aiClient = new AIClient();
