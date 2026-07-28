import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  SNAPSHOT_DEBOUNCE_MS: parseInt(process.env.SNAPSHOT_DEBOUNCE_MS || '10000', 10),
  ROOM_IDLE_TIMEOUT_MS: parseInt(process.env.ROOM_IDLE_TIMEOUT_MS || '60000', 10),
  MAX_SAVE_RETRIES: parseInt(process.env.MAX_SAVE_RETRIES || '3', 10),
  INITIAL_SAVE_RETRY_INTERVAL_MS: parseInt(process.env.SAVE_RETRY_INTERVAL_MS || '5000', 10),

  // Redis Configuration
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  ENABLE_REDIS: process.env.ENABLE_REDIS !== 'false',
  SESSION_TTL_SECONDS: parseInt(process.env.SESSION_TTL_SECONDS || '3600', 10),

  // FastAPI AI Microservice URL
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
};
