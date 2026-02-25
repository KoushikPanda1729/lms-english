import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { AuthService } from "./auth.service"
import { Platform } from "../../enums/index"
import { success } from "../../shared/response"
import { ValidationError } from "../../shared/errors"

// ─── Schemas ───────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  deviceId: z.string().default("web"),
  platform: z.nativeEnum(Platform).default(Platform.WEB),
})

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  deviceId: z.string().default("web"),
  platform: z.nativeEnum(Platform).default(Platform.WEB),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
})

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

// ─── Controller ────────────────────────────────────────────────────────────────

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const result = await this.authService.register(parsed.data)
      res.status(201).json(success(result, "Registration successful"))
    } catch (err) {
      next(err)
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const result = await this.authService.login(parsed.data)
      res.json(success(result, "Login successful"))
    } catch (err) {
      next(err)
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = refreshSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const result = await this.authService.refresh(parsed.data.refreshToken)
      res.json(success(result, "Token refreshed"))
    } catch (err) {
      next(err)
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = refreshSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      await this.authService.logout(parsed.data.refreshToken)
      res.json(success(null, "Logged out successfully"))
    } catch (err) {
      next(err)
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      await this.authService.forgotPassword(parsed.data.email)
      // Always return same message — never reveal if email exists
      res.json(success(null, "If that email exists, a reset link has been sent"))
    } catch (err) {
      next(err)
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      await this.authService.resetPassword(parsed.data.token, parsed.data.newPassword)
      res.json(success(null, "Password reset successfully"))
    } catch (err) {
      next(err)
    }
  }
}
