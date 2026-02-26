import { AppDataSource } from "./config/database.config"
import { User } from "./entities/User.entity"
import { RefreshToken } from "./entities/RefreshToken.entity"
import { PasswordResetToken } from "./entities/PasswordResetToken.entity"
import { Profile } from "./entities/Profile.entity"
import { CallSession } from "./entities/CallSession.entity"
import { SessionRating } from "./entities/SessionRating.entity"
import { Report } from "./entities/Report.entity"
import { DeviceToken } from "./entities/DeviceToken.entity"
import { Notification } from "./entities/Notification.entity"
import { AuthService } from "./modules/auth/auth.service"
import { AuthController } from "./modules/auth/auth.controller"
import { UserService } from "./modules/users/user.service"
import { UserController } from "./modules/users/user.controller"
import { SessionService } from "./modules/sessions/session.service"
import { SessionController } from "./modules/sessions/session.controller"
import { ReportService } from "./modules/reports/report.service"
import { ReportController } from "./modules/reports/report.controller"
import { NotificationService } from "./modules/notifications/notification.service"
import { NotificationController } from "./modules/notifications/notification.controller"
import { createNotificationProvider } from "./modules/notifications/providers/notification-provider.factory"
import { StorageService } from "./services/storage.service"

export function buildContainer() {
  // ─── Repositories ───────────────────────────────────────────────────────────
  const userRepo = AppDataSource.getRepository(User)
  const refreshTokenRepo = AppDataSource.getRepository(RefreshToken)
  const passwordResetTokenRepo = AppDataSource.getRepository(PasswordResetToken)
  const profileRepo = AppDataSource.getRepository(Profile)
  const sessionRepo = AppDataSource.getRepository(CallSession)
  const ratingRepo = AppDataSource.getRepository(SessionRating)
  const reportRepo = AppDataSource.getRepository(Report)
  const deviceTokenRepo = AppDataSource.getRepository(DeviceToken)
  const notificationRepo = AppDataSource.getRepository(Notification)

  // ─── Shared services ────────────────────────────────────────────────────────
  const storageService = new StorageService()

  // ─── Notifications (constructed early — needed by AuthController) ────────────
  const notificationProvider = createNotificationProvider()
  const notificationService = new NotificationService(
    deviceTokenRepo,
    notificationRepo,
    notificationProvider,
  )
  const notificationController = new NotificationController(notificationService)

  // ─── Auth ───────────────────────────────────────────────────────────────────
  const authService = new AuthService(
    userRepo,
    refreshTokenRepo,
    passwordResetTokenRepo,
    AppDataSource,
  )
  const authController = new AuthController(authService, notificationService)

  // ─── Users ──────────────────────────────────────────────────────────────────
  const userService = new UserService(profileRepo, storageService)
  const userController = new UserController(userService)

  // ─── Sessions ───────────────────────────────────────────────────────────────
  const sessionService = new SessionService(sessionRepo, ratingRepo, profileRepo)
  const sessionController = new SessionController(sessionService)

  // ─── Reports ────────────────────────────────────────────────────────────────
  const reportService = new ReportService(reportRepo, userRepo, refreshTokenRepo)
  const reportController = new ReportController(reportService)

  return {
    authController,
    userController,
    sessionController,
    sessionService,
    reportController,
    notificationController,
    notificationService,
    userRepo,
    profileRepo,
  }
}

export type Container = ReturnType<typeof buildContainer>
