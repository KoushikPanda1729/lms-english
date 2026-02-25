import { Redis } from "ioredis"
import { Config } from "./config"
import logger from "./logger"

let redisClient: Redis | null = null

export const createRedisClient = (): Redis => {
  if (redisClient) return redisClient

  redisClient = new Redis({
    host: Config.REDIS_HOST,
    port: Number(Config.REDIS_PORT),
    password: Config.REDIS_PASSWORD || undefined,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  })

  redisClient.on("connect", () => logger.info("✅  Redis connected"))
  redisClient.on("error", (err: Error) => console.error("❌  Redis error:", err))

  return redisClient
}

export const getRedisClient = (): Redis => {
  if (!redisClient) throw new Error("Redis not initialized. Call createRedisClient first.")
  return redisClient
}
