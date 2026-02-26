import { createHmac } from "crypto"
import { Config } from "../config/config"

export interface TurnCredentials {
  username: string
  credential: string
  urls: string[]
}

export function generateTurnCredentials(userId: string): TurnCredentials {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600 // valid for 1 hour
  const username = `${expiresAt}:${userId}`
  const credential = createHmac("sha1", Config.TURN_SECRET).update(username).digest("base64")

  return {
    username,
    credential,
    urls: [
      `stun:${Config.TURN_HOST}:${Config.TURN_PORT}`,
      `turn:${Config.TURN_HOST}:${Config.TURN_PORT}`,
      `turn:${Config.TURN_HOST}:${Config.TURN_PORT}?transport=tcp`,
    ],
  }
}
