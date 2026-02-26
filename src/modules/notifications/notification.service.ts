import { Repository } from "typeorm"
import { DeviceToken } from "../../entities/DeviceToken.entity"
import { Notification } from "../../entities/Notification.entity"
import { NotificationType, Platform } from "../../enums/index"
import { INotificationProvider, PushMessage } from "./providers/notification-provider.interface"
import { NotFoundError, ForbiddenError } from "../../shared/errors"
import logger from "../../config/logger"

interface RegisterDeviceDto {
  fcmToken: string
  deviceId: string
  platform: Platform
}

interface SendNotificationDto {
  type: NotificationType
  title: string
  body: string
  data?: Record<string, string> | null
}

export class NotificationService {
  constructor(
    private readonly deviceTokenRepo: Repository<DeviceToken>,
    private readonly notificationRepo: Repository<Notification>,
    private readonly provider: INotificationProvider,
  ) {}

  // ─── POST /notifications/device ───────────────────────────────────────────────
  // Upsert — called on every app launch (tokens rotate on iOS/Android)

  async registerDevice(userId: string, dto: RegisterDeviceDto): Promise<void> {
    const existing = await this.deviceTokenRepo.findOne({
      where: { userId, deviceId: dto.deviceId },
    })

    if (existing) {
      existing.fcmToken = dto.fcmToken
      existing.platform = dto.platform
      await this.deviceTokenRepo.save(existing)
    } else {
      const token = this.deviceTokenRepo.create({
        userId,
        fcmToken: dto.fcmToken,
        deviceId: dto.deviceId,
        platform: dto.platform,
      })
      await this.deviceTokenRepo.save(token)
    }

    logger.debug(`Device token registered userId=${userId} deviceId=${dto.deviceId}`)
  }

  // ─── DELETE /notifications/device ─────────────────────────────────────────────
  // Called on logout — removes token for this device only

  async unregisterDevice(userId: string, deviceId: string): Promise<void> {
    await this.deviceTokenRepo.delete({ userId, deviceId })
    logger.debug(`Device token removed userId=${userId} deviceId=${deviceId}`)
  }

  // Called on logout-all — removes all tokens for this user
  async unregisterAllDevices(userId: string): Promise<void> {
    await this.deviceTokenRepo.delete({ userId })
    logger.debug(`All device tokens removed userId=${userId}`)
  }

  // ─── GET /notifications ───────────────────────────────────────────────────────

  async getMyNotifications(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ notifications: Notification[]; total: number; page: number; limit: number }> {
    const [notifications, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    })
    return { notifications, total, page, limit }
  }

  // ─── PATCH /notifications/:id/read ────────────────────────────────────────────

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({ where: { id: notificationId } })
    if (!notification) throw new NotFoundError("Notification not found")
    if (notification.userId !== userId) throw new ForbiddenError("Access denied")
    if (notification.read) return notification

    notification.read = true
    notification.readAt = new Date()
    return this.notificationRepo.save(notification)
  }

  // ─── PATCH /notifications/read-all ────────────────────────────────────────────

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, read: false }, { read: true, readAt: new Date() })
  }

  // ─── Send push + save record (called from other services) ─────────────────────

  async sendToUser(userId: string, dto: SendNotificationDto): Promise<void> {
    // Save notification record first (user sees it in-app even if push fails)
    const notification = this.notificationRepo.create({
      userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data ?? null,
      read: false,
    })
    await this.notificationRepo.save(notification)

    // Fetch all device tokens for this user
    const deviceTokens = await this.deviceTokenRepo.find({ where: { userId } })
    if (!deviceTokens.length) return

    const tokens = deviceTokens.map((d) => d.fcmToken)
    const message: PushMessage = {
      title: dto.title,
      body: dto.body,
      data: dto.data ?? undefined,
    }

    try {
      const result = await this.provider.sendMulticast(tokens, message)

      // Update sent_at on success
      notification.sentAt = new Date()
      await this.notificationRepo.save(notification)

      // Remove stale tokens (device unregistered / app uninstalled)
      if (result.failedTokens.length) {
        await this.deviceTokenRepo
          .createQueryBuilder()
          .delete()
          .where("fcm_token IN (:...tokens)", { tokens: result.failedTokens })
          .execute()

        logger.debug(
          `Removed ${result.failedTokens.length} stale FCM token(s) for userId=${userId}`,
        )
      }
    } catch (err) {
      logger.error("Push notification failed", { error: err, userId })
    }
  }
}
