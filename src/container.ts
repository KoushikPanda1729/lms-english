import { AppDataSource } from "./config/database.config"
import { User } from "./entities/User.entity"
import { RefreshToken } from "./entities/RefreshToken.entity"
import { PasswordResetToken } from "./entities/PasswordResetToken.entity"
import { AuthService } from "./modules/auth/auth.service"
import { AuthController } from "./modules/auth/auth.controller"

export function buildContainer() {
  // ─── Repositories ───────────────────────────────────────────────────────────
  const userRepo = AppDataSource.getRepository(User)
  const refreshTokenRepo = AppDataSource.getRepository(RefreshToken)
  const passwordResetTokenRepo = AppDataSource.getRepository(PasswordResetToken)

  // ─── Auth ───────────────────────────────────────────────────────────────────
  const authService = new AuthService(userRepo, refreshTokenRepo, passwordResetTokenRepo)
  const authController = new AuthController(authService)

  return { authController }
}

export type Container = ReturnType<typeof buildContainer>
