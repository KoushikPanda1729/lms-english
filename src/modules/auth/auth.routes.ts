import { Router } from "express"
import { AuthController } from "./auth.controller"
import { authMiddleware } from "../../middleware/auth.middleware"
import { validateRefreshToken } from "../../middleware/validate-refresh-token.middleware"

export function authRouter(controller: AuthController): Router {
  const router = Router()

  router.get("/self", authMiddleware, (req, res, next) => controller.self(req, res, next))
  router.post("/register", (req, res, next) => controller.register(req, res, next))
  router.post("/login", (req, res, next) => controller.login(req, res, next))
  router.post("/refresh", validateRefreshToken, (req, res, next) =>
    controller.refresh(req, res, next),
  )
  router.post("/logout", validateRefreshToken, (req, res, next) =>
    controller.logout(req, res, next),
  )
  router.post("/google", (req, res, next) => controller.googleSignIn(req, res, next))
  router.post("/forgot-password", (req, res, next) => controller.forgotPassword(req, res, next))
  router.post("/reset-password", (req, res, next) => controller.resetPassword(req, res, next))

  return router
}
