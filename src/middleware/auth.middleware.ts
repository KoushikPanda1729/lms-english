import { Request, Response, NextFunction } from "express"
import { Repository } from "typeorm"
import { verifyAccessToken } from "../modules/auth/jwt.util"
import { UnauthorizedError } from "../shared/errors"
import { User } from "../entities/User.entity"

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

    // Check ban status — userRepo is set on app.locals in app.ts
    const userRepo = req.app.locals.userRepo as Repository<User> | undefined
    if (userRepo) {
      const user = await userRepo.findOne({
        where: { id: payload.sub },
        select: ["id", "isBanned"],
      })
      if (user?.isBanned) throw new UnauthorizedError("Account has been suspended")
    }

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
