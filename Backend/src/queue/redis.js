import IORedis from "ioredis";
import "dotenv/config";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is required");
}

export const connection = new IORedis(redisUrl, {
  // BullMQ requires this to prevent command retry conflicts.
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 1000, 10000),
  ...(redisUrl.startsWith("rediss://")
    ? {
        family: 4,
        enableReadyCheck: false,
        tls: {},
      }
    : {}),
});
