import "reflect-metadata"
import { AppDataSource } from "./config/database.config"
import { createRedisClient } from "./config/redis.config"
import { buildContainer } from "./container"
import { buildApp } from "./app"
import { Config } from "./config/config"

async function bootstrap() {
  try {
    // ── Database ──────────────────────────────────────────────────────────────
    await AppDataSource.initialize()
    console.log("✅  PostgreSQL connected")

    // ── Redis ─────────────────────────────────────────────────────────────────
    const redis = createRedisClient()
    await redis.ping()

    // ── DI Container ──────────────────────────────────────────────────────────
    const container = buildContainer()

    // ── Express ───────────────────────────────────────────────────────────────
    const app = buildApp(container)
    app.listen(Number(Config.PORT), "0.0.0.0", () => {
      console.log(`✅  Server running  → http://localhost:${Config.PORT}`)
      console.log(`✅  Environment     → ${Config.NODE_ENV}`)
    })
  } catch (err) {
    console.error("❌  Failed to start server:", err)
    process.exit(1)
  }
}

bootstrap()
