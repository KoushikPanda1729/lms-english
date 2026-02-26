import { INotificationProvider } from "./notification-provider.interface"
import { FcmProvider } from "./fcm.provider"
import { Config } from "../../../config/config"
import logger from "../../../config/logger"

export function createNotificationProvider(): INotificationProvider {
  const provider = Config.NOTIFICATION_PROVIDER

  switch (provider) {
    case "fcm":
      logger.info("Notification provider → FCM (Firebase)")
      return new FcmProvider()

    default:
      logger.warn(`Unknown NOTIFICATION_PROVIDER="${provider}" — defaulting to FCM`)
      return new FcmProvider()
  }
}
