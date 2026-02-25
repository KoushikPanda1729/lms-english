import express, { Application } from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import rateLimit from "express-rate-limit"
import { Config } from "./config/config"
import { authRouter } from "./modules/auth/auth.routes"
import { userRouter } from "./modules/users/user.routes"
import { jwksRouter } from "./modules/well-known/jwks.routes"
import { globalErrorHandler } from "./middleware/error.middleware"
import type { Container } from "./container"

export function buildApp(container: Container): Application {
  const app = express()

  // ─── Core middleware ─────────────────────────────────────────────────────────
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  app.use(
    cors({
      origin: Config.CORS_ORIGINS.length ? Config.CORS_ORIGINS : "*",
      credentials: true,
    }),
  )

  app.use(helmet())

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  // ─── Health check ────────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: Config.NODE_ENV,
    })
  })

  // ─── Routes ──────────────────────────────────────────────────────────────────
  app.use("/auth", authRouter(container.authController))
  app.use("/users", userRouter(container.userController))
  app.use("/.well-known", jwksRouter())

  // ─── Global error handler (must be last) ─────────────────────────────────────
  app.use(globalErrorHandler)

  return app
}
