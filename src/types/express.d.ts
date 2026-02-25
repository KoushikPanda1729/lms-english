import { RefreshToken } from "../entities/RefreshToken.entity"

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
      }
      refreshToken?: {
        plain: string
        record: RefreshToken
      }
    }
  }
}

export {}
