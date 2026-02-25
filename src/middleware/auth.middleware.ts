import { Request, Response, NextFunction } from "express"
import { verifyAccessToken } from "../modules/auth/jwt.util"
import { UnauthorizedError } from "../shared/errors"

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let token: string | undefined

    // Priority 1: Authorization header (mobile + web)
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
    }

    // Priority 2: accessToken cookie (web fallback)
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken as string
    }

    if (!token) throw new UnauthorizedError("Missing authorization")

    const payload = await verifyAccessToken(token)

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    }

    next()
  } catch (err) {
    next(err)
  }
}
