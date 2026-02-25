import { Platform } from "../../../enums/index"

export interface RegisterParams {
  email: string
  password: string
  deviceId: string
  platform: Platform
}

export interface LoginParams {
  email: string
  password: string
  deviceId: string
  platform: Platform
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    role: string
  }
}

export interface JwtPayload {
  sub: string
  email: string
  role: string
}
