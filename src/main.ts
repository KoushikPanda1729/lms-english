import "reflect-metadata"
import { AppDataSource } from "./config/database.config"
import { createRedisClient } from "./config/redis.config"
import { buildContainer } from "./container"
import { buildApp } from "./app"
import { Config } from "./config/config"
import logger from "./config/logger"

async function bootstrap() {
  try {
    // ── Database ──────────────────────────────────────────────────────────────
    await AppDataSource.initialize()
    logger.info("PostgreSQL connected")

    // ── Redis ─────────────────────────────────────────────────────────────────
    const redis = createRedisClient()
    await redis.ping()
    logger.info("Redis connected")

    // ── DI Container ──────────────────────────────────────────────────────────
    const container = buildContainer()

    // ── Express ───────────────────────────────────────────────────────────────
    const app = buildApp(container)
    app.listen(Number(Config.PORT), "0.0.0.0", () => {
      logger.info(`Server running → http://localhost:${Config.PORT}`)
      logger.info(`Environment    → ${Config.NODE_ENV}`)
    })
  } catch (err) {
    logger.error("Failed to start server", { error: err })
    process.exit(1)
  }
}

bootstrap()
