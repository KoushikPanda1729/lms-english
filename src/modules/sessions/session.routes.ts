import { Router } from "express"
import { SessionController } from "./session.controller"
import { authMiddleware } from "../../middleware/auth.middleware"

export function sessionRouter(controller: SessionController): Router {
  const router = Router()

  // All session routes require authentication
  router.use(authMiddleware)

  router.get("/", (req, res, next) => controller.getMyHistory(req, res, next))
  router.get("/:id", (req, res, next) => controller.getSession(req, res, next))
  router.post("/:id/rate", (req, res, next) => controller.rateSession(req, res, next))

  return router
}
