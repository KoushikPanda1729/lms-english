import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { AuthService } from "./auth.service"
import { Platform } from "../../enums/index"
import { success } from "../../shared/response"
import { ValidationError } from "../../shared/errors"
import { Config } from "../../config/config"

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

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

// ─── Cookie helpers ────────────────────────────────────────────────────────────

const COOKIE_NAME = "refreshToken"

const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: Config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE_MS,
  })
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: Config.NODE_ENV === "production",
    sameSite: "strict",
  })
}

// Web sends via cookie, mobile sends via body — accept both
function getRefreshToken(req: Request): string | undefined {
  return (req.cookies?.[COOKIE_NAME] as string | undefined) ?? req.body?.refreshToken
}

// ─── Controller ────────────────────────────────────────────────────────────────

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async self(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.authService.self(req.user!.id)
      res.json(success(user, "User fetched"))
    } catch (err) {
      next(err)
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const result = await this.authService.register(parsed.data)
      setRefreshCookie(res, result.refreshToken)
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
      setRefreshCookie(res, result.refreshToken)
      res.json(success(result, "Login successful"))
    } catch (err) {
      next(err)
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = getRefreshToken(req)
      if (!token) throw new ValidationError("Refresh token is required")

      const result = await this.authService.refresh(token)
      setRefreshCookie(res, result.refreshToken)
      res.json(success(result, "Token refreshed"))
    } catch (err) {
      next(err)
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = getRefreshToken(req)
      if (token) await this.authService.logout(token)
      clearRefreshCookie(res)
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
      clearRefreshCookie(res)
      res.json(success(null, "Password reset successfully"))
    } catch (err) {
      next(err)
    }
  }
}
