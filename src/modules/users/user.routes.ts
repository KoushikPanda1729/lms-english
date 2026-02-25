import { Router } from "express"
import multer from "multer"
import { UserController } from "./user.controller"
import { authMiddleware } from "../../middleware/auth.middleware"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
})

export function userRouter(controller: UserController): Router {
  const router = Router()

  router.get("/me", authMiddleware, (req, res, next) => controller.getMe(req, res, next))
  router.patch("/me", authMiddleware, (req, res, next) => controller.updateMe(req, res, next))
  router.post("/me/avatar", authMiddleware, upload.single("avatar"), (req, res, next) =>
    controller.uploadAvatar(req, res, next),
  )
  router.delete("/me/avatar", authMiddleware, (req, res, next) =>
    controller.deleteAvatar(req, res, next),
  )
  router.get("/:id/public", (req, res, next) => controller.getPublicProfile(req, res, next))

  return router
}
