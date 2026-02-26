import { Router } from "express"
import { ReportController } from "./report.controller"
import { authMiddleware } from "../../middleware/auth.middleware"
import { adminMiddleware } from "../../middleware/admin.middleware"

// ─── User routes: mounted at /reports ─────────────────────────────────────────

export function reportRouter(controller: ReportController): Router {
  const router = Router()

  router.use(authMiddleware)

  router.post("/", (req, res, next) => controller.submitReport(req, res, next))
  router.get("/mine", (req, res, next) => controller.getMyReports(req, res, next))

  return router
}

// ─── Admin routes: mounted at /admin ──────────────────────────────────────────

export function adminRouter(controller: ReportController): Router {
  const router = Router()

  router.use(authMiddleware)
  router.use(adminMiddleware)

  router.get("/reports", (req, res, next) => controller.getAllReports(req, res, next))
  router.patch("/reports/:id", (req, res, next) => controller.updateReport(req, res, next))

  return router
}
