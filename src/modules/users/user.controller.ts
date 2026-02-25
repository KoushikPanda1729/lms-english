import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { UserService } from "./user.service"
import { EnglishLevel, LearningGoal } from "../../enums/index"
import { success } from "../../shared/response"
import { ValidationError } from "../../shared/errors"

// ─── Schemas ───────────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  displayName: z
    .string()
    .min(1, "Display name cannot be empty")
    .max(50, "Display name must be at most 50 characters")
    .optional(),
  bio: z.string().max(300, "Bio must be at most 300 characters").optional(),
  nativeLanguage: z.string().min(2).max(50).optional(),
  englishLevel: z.nativeEnum(EnglishLevel).optional(),
  learningGoal: z.nativeEnum(LearningGoal).optional(),
  country: z.string().min(2).max(100).optional(),
  timezone: z.string().min(3).max(50).optional(),
})

// ─── Controller ────────────────────────────────────────────────────────────────

export class UserController {
  constructor(private readonly userService: UserService) {}

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await this.userService.getMe(req.user!.id)
      res.json(success(profile, "Profile fetched"))
    } catch (err) {
      next(err)
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateProfileSchema.safeParse(req.body)
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message)

      const profile = await this.userService.updateMe(req.user!.id, parsed.data)
      res.json(success(profile, "Profile updated"))
    } catch (err) {
      next(err)
    }
  }

  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw new ValidationError("No file uploaded")

      const profile = await this.userService.uploadAvatar(
        req.user!.id,
        req.file.buffer,
        req.file.mimetype,
      )
      res.json(success(profile, "Avatar uploaded"))
    } catch (err) {
      next(err)
    }
  }

  async deleteAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await this.userService.deleteAvatar(req.user!.id)
      res.json(success(profile, "Avatar removed"))
    } catch (err) {
      next(err)
    }
  }

  async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(id)) throw new ValidationError("Invalid user ID")

      const profile = await this.userService.getPublicProfile(id)
      res.json(success(profile, "Profile fetched"))
    } catch (err) {
      next(err)
    }
  }
}
