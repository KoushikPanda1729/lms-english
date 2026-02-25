import { Request, Response, NextFunction } from "express"
import { verifyAccessToken } from "../modules/auth/jwt.util"
import { UnauthorizedError } from "../shared/errors"

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing authorization header")
    }

    const token = authHeader.split(" ")[1]
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
