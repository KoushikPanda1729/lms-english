import admin from "firebase-admin"
import {
  INotificationProvider,
  PushMessage,
  MulticastResult,
} from "./notification-provider.interface"
import { Config } from "../../../config/config"
import logger from "../../../config/logger"

// Error codes from FCM that mean the token is permanently invalid
const INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
])

export class FcmProvider implements INotificationProvider {
  private _messaging: admin.messaging.Messaging | null = null

  private get messaging(): admin.messaging.Messaging {
    if (!this._messaging) {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: Config.FIREBASE_PROJECT_ID,
            clientEmail: Config.FIREBASE_CLIENT_EMAIL,
            privateKey: Config.FIREBASE_PRIVATE_KEY,
          }),
        })
      }
      this._messaging = admin.messaging()
    }
    return this._messaging
  }

  async sendPush(token: string, message: PushMessage): Promise<void> {
    await this.messaging.send({
      token,
      notification: { title: message.title, body: message.body },
      data: message.data,
    })
  }

  async sendMulticast(tokens: string[], message: PushMessage): Promise<MulticastResult> {
    if (!tokens.length) return { successCount: 0, failedTokens: [] }

    const response = await this.messaging.sendEachForMulticast({
      tokens,
      notification: { title: message.title, body: message.body },
      data: message.data,
    })

    const failedTokens: string[] = []

    response.responses.forEach((res, idx) => {
      if (!res.success && INVALID_TOKEN_CODES.has(res.error?.code ?? "")) {
        failedTokens.push(tokens[idx])
      }
    })

    logger.debug(
      `FCM multicast: total=${tokens.length} success=${response.successCount} failed=${failedTokens.length}`,
    )

    return { successCount: response.successCount, failedTokens }
  }
}
