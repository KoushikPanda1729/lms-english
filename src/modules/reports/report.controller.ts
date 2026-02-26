import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { ReportService } from "./report.service"
import { ReportReason, ReportStatus } from "../../enums/index"
import { success } from "../../shared/response"
import { ValidationError } from "../../shared/errors"

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const submitSchema = z.object({
  reportedId: z.string().uuid("Invalid reported user ID"),
  sessionId: z.string().uuid("Invalid session ID").optional().nullable(),
  reason: z.nativeEnum(ReportReason),
  description: z.string().max(1000).optional().nullable(),
})

const updateSchema = z.object({
  status: z.nativeEnum(ReportStatus).optional(),
  adminNote: z.string().max(1000).optional().nullable(),
  banReportedUser: z.boolean().optional(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.nativeEnum(ReportStatus).optional(),
})

export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // ─── POST /reports ────────────────────────────────────────────────────────────

  async submitReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = submitSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const report = await this.reportService.submitReport(req.user!.id, parsed.data)
      res.status(201).json(success(report, "Report submitted"))
    } catch (err) {
      next(err)
    }
  }

  // ─── GET /reports/mine ────────────────────────────────────────────────────────

  async getMyReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = paginationSchema.safeParse(req.query)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const result = await this.reportService.getMyReports(
        req.user!.id,
        parsed.data.page,
        parsed.data.limit,
      )
      res.json(success(result, "Reports fetched"))
    } catch (err) {
      next(err)
    }
  }

  // ─── GET /admin/reports ───────────────────────────────────────────────────────

  async getAllReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = paginationSchema.safeParse(req.query)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const result = await this.reportService.getAllReports(
        parsed.data.status,
        parsed.data.page,
        parsed.data.limit,
      )
      res.json(success(result, "Reports fetched"))
    } catch (err) {
      next(err)
    }
  }

  // ─── PATCH /admin/reports/:id ─────────────────────────────────────────────────

  async updateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id)
      if (!uuidRegex.test(id)) throw new ValidationError("Invalid report ID")

      const parsed = updateSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const report = await this.reportService.updateReport(id, parsed.data)
      res.json(success(report, "Report updated"))
    } catch (err) {
      next(err)
    }
  }
}
