import { Request, Response, NextFunction } from "express"
import { ForbiddenError, UnauthorizedError } from "../shared/errors"

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) throw new UnauthorizedError("Not authenticated")
      if (!roles.includes(req.user.role)) throw new ForbiddenError("Insufficient permissions")
      next()
    } catch (err) {
      next(err)
    }
  }
}
