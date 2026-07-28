import { CONFIG } from '../config/constants';

export interface AIServiceHealth {
  status: string;
  provider?: string;
  model?: string;
  available?: boolean;
  responseTimeMs?: number;
  error?: string;
}

export interface AIServiceClient {
  generateStream(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    signal: AbortSignal
  ): Promise<ReadableStream<Uint8Array>>;
  checkHealth(timeoutMs?: number): Promise<AIServiceHealth>;
}

export class FastAPIClient implements AIServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = CONFIG.AI_SERVICE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Connect to FastAPI SSE generation endpoint and return ReadableStream
   */
  public async generateStream(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    signal: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    const url = `${this.baseUrl}/api/v1/ai/generate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `FastAPI AI service returned HTTP ${response.status}: ${errorText || response.statusText}`
      );
    }

    if (!response.body) {
      throw new Error('FastAPI AI service returned empty response stream');
    }

    return response.body as ReadableStream<Uint8Array>;
  }

  /**
   * Diagnostic check of FastAPI AI microservice status with non-blocking timeout
   */
  public async checkHealth(timeoutMs: number = 500): Promise<AIServiceHealth> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as AIServiceHealth;
        return data;
      }
      return { status: 'unknown', error: `HTTP ${response.status}` };
    } catch {
      clearTimeout(timeoutId);
      return { status: 'unknown' };
    }
  }
}

export const fastAPIClient = new FastAPIClient();
