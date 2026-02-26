import { Router } from "express"
import { NotificationController } from "./notification.controller"
import { authMiddleware } from "../../middleware/auth.middleware"

export function notificationRouter(controller: NotificationController): Router {
  const router = Router()

  router.use(authMiddleware)

  router.post("/device", (req, res, next) => controller.registerDevice(req, res, next))
  router.delete("/device", (req, res, next) => controller.unregisterDevice(req, res, next))
  router.get("/", (req, res, next) => controller.getMyNotifications(req, res, next))
  router.patch("/read-all", (req, res, next) => controller.markAllAsRead(req, res, next))
  router.patch("/:id/read", (req, res, next) => controller.markAsRead(req, res, next))

  return router
}
