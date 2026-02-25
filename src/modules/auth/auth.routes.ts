import { Router } from "express"
import { AuthController } from "./auth.controller"

export function authRouter(controller: AuthController): Router {
  const router = Router()

  router.post("/register", (req, res, next) => controller.register(req, res, next))
  router.post("/login", (req, res, next) => controller.login(req, res, next))
  router.post("/refresh", (req, res, next) => controller.refresh(req, res, next))
  router.post("/logout", (req, res, next) => controller.logout(req, res, next))
  router.post("/forgot-password", (req, res, next) => controller.forgotPassword(req, res, next))
  router.post("/reset-password", (req, res, next) => controller.resetPassword(req, res, next))

  return router
}
