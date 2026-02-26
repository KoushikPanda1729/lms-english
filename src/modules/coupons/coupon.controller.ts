import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { CouponService } from "./coupon.service"
import { success } from "../../shared/response"
import { ValidationError } from "../../shared/errors"

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  discountPercent: z.number().int().min(1).max(100),
  courseId: z.string().uuid().nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
})

const updateCouponSchema = z.object({
  isActive: z.boolean().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
})

const listCouponsSchema = paginationSchema.extend({
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  courseId: z.string().uuid().optional(),
})

export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  // ─── POST /admin/coupons ──────────────────────────────────────────────────────

  async createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createCouponSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const { expiresAt, ...rest } = parsed.data
      const result = await this.couponService.create({
        ...rest,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      res.status(201).json(success(result, "Coupon created"))
    } catch (err) {
      next(err)
    }
  }

  // ─── GET /admin/coupons ───────────────────────────────────────────────────────

  async listCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = listCouponsSchema.safeParse(req.query)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const result = await this.couponService.list({
        page: parsed.data.page,
        limit: parsed.data.limit,
        isActive: parsed.data.isActive,
        courseId: parsed.data.courseId,
      })
      res.json(success(result, "Coupons fetched"))
    } catch (err) {
      next(err)
    }
  }

  // ─── GET /admin/coupons/:id ───────────────────────────────────────────────────

  async getCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id)
      if (!uuidRegex.test(id)) throw new ValidationError("Invalid coupon ID")

      const result = await this.couponService.getById(id)
      res.json(success(result, "Coupon fetched"))
    } catch (err) {
      next(err)
    }
  }

  // ─── PATCH /admin/coupons/:id ─────────────────────────────────────────────────

  async updateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id)
      if (!uuidRegex.test(id)) throw new ValidationError("Invalid coupon ID")

      const parsed = updateCouponSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const { expiresAt, ...rest } = parsed.data
      const result = await this.couponService.update(id, {
        ...rest,
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
      })
      res.json(success(result, "Coupon updated"))
    } catch (err) {
      next(err)
    }
  }

  // ─── DELETE /admin/coupons/:id ────────────────────────────────────────────────

  async deleteCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id)
      if (!uuidRegex.test(id)) throw new ValidationError("Invalid coupon ID")

      await this.couponService.delete(id)
      res.json(success(null, "Coupon deleted"))
    } catch (err) {
      next(err)
    }
  }
}
