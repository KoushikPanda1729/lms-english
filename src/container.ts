import { AppDataSource } from "./config/database.config"
import { User } from "./entities/User.entity"
import { RefreshToken } from "./entities/RefreshToken.entity"
import { PasswordResetToken } from "./entities/PasswordResetToken.entity"
import { Profile } from "./entities/Profile.entity"
import { CallSession } from "./entities/CallSession.entity"
import { SessionRating } from "./entities/SessionRating.entity"
import { AuthService } from "./modules/auth/auth.service"
import { AuthController } from "./modules/auth/auth.controller"
import { UserService } from "./modules/users/user.service"
import { UserController } from "./modules/users/user.controller"
import { SessionService } from "./modules/sessions/session.service"
import { SessionController } from "./modules/sessions/session.controller"
import { StorageService } from "./services/storage.service"

export function buildContainer() {
  // ─── Repositories ───────────────────────────────────────────────────────────
  const userRepo = AppDataSource.getRepository(User)
  const refreshTokenRepo = AppDataSource.getRepository(RefreshToken)
  const passwordResetTokenRepo = AppDataSource.getRepository(PasswordResetToken)
  const profileRepo = AppDataSource.getRepository(Profile)
  const sessionRepo = AppDataSource.getRepository(CallSession)
  const ratingRepo = AppDataSource.getRepository(SessionRating)

  // ─── Shared services ────────────────────────────────────────────────────────
  const storageService = new StorageService()

  // ─── Auth ───────────────────────────────────────────────────────────────────
  const authService = new AuthService(
    userRepo,
    refreshTokenRepo,
    passwordResetTokenRepo,
    AppDataSource,
  )
  const authController = new AuthController(authService)

  // ─── Users ──────────────────────────────────────────────────────────────────
  const userService = new UserService(profileRepo, storageService)
  const userController = new UserController(userService)

  // ─── Sessions ───────────────────────────────────────────────────────────────
  const sessionService = new SessionService(sessionRepo, ratingRepo, profileRepo)
  const sessionController = new SessionController(sessionService)

  return {
    authController,
    userController,
    sessionController,
    sessionService,
    userRepo,
    profileRepo,
  }
}

export type Container = ReturnType<typeof buildContainer>
