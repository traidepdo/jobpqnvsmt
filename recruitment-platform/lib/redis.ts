import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379/0';

declare global {
  var __redisClient: any;
}

function createRedisClient() {
  const client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        // Stop retrying after 3 attempts in local dev to prevent endless connection attempts
        if (retries > 2) {
          return false;
        }
        return Math.min(retries * 100, 3000);
      },
      tls: redisUrl.startsWith('rediss://') ? true : undefined,
      rejectUnauthorized: redisUrl.startsWith('rediss://') ? false : undefined,
    },
    disableOfflineQueue: true
  });
  
  client.on('error', (err) => {
    // Suppress ECONNREFUSED logs completely to keep dev terminal clean
    if (err.code === 'ECONNREFUSED') {
      return;
    }
    console.error('Redis Client Error', err);
  });
  
  client.connect().catch(err => {
    if (err.code !== 'ECONNREFUSED') {
      console.error('Redis connection failed:', err);
    }
  });
  
  return client;
}

export const redis = (global.__redisClient ?? createRedisClient()) as ReturnType<typeof createClient>;

if (process.env.NODE_ENV !== 'production') {
  global.__redisClient = redis;
}

