import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  SNAPSHOT_DEBOUNCE_MS: parseInt(process.env.SNAPSHOT_DEBOUNCE_MS || '10000', 10),
  ROOM_IDLE_TIMEOUT_MS: parseInt(process.env.ROOM_IDLE_TIMEOUT_MS || '60000', 10),
  MAX_SAVE_RETRIES: parseInt(process.env.MAX_SAVE_RETRIES || '3', 10),
  INITIAL_SAVE_RETRY_INTERVAL_MS: parseInt(process.env.SAVE_RETRY_INTERVAL_MS || '5000', 10),
};
