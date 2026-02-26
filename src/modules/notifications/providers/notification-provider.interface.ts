export interface PushMessage {
  title: string
  body: string
  data?: Record<string, string> // FCM data payload — values must be strings
}

export interface MulticastResult {
  successCount: number
  failedTokens: string[] // tokens that should be removed from DB
}

export interface INotificationProvider {
  /**
   * Send push to a single device token
   */
  sendPush(token: string, message: PushMessage): Promise<void>

  /**
   * Send push to multiple device tokens at once.
   * Returns which tokens are no longer valid (device unregistered).
   */
  sendMulticast(tokens: string[], message: PushMessage): Promise<MulticastResult>
}
