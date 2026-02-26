import { Router } from "express"
import { CouponController } from "./coupon.controller"
import { authMiddleware } from "../../middleware/auth.middleware"
import { adminMiddleware } from "../../middleware/admin.middleware"

export function couponRouter(controller: CouponController): Router {
  const router = Router()

  router.use(authMiddleware)
  router.use(adminMiddleware)

  router.post("/coupons", (req, res, next) => controller.createCoupon(req, res, next))
  router.get("/coupons", (req, res, next) => controller.listCoupons(req, res, next))
  router.get("/coupons/:id", (req, res, next) => controller.getCoupon(req, res, next))
  router.patch("/coupons/:id", (req, res, next) => controller.updateCoupon(req, res, next))
  router.delete("/coupons/:id", (req, res, next) => controller.deleteCoupon(req, res, next))

  return router
}
