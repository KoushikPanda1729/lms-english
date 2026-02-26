import { Request, Response, NextFunction } from "express"
import { UserRole } from "../enums/index"
import { ForbiddenError } from "../shared/errors"

export function adminMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== UserRole.ADMIN) {
    return next(new ForbiddenError("Admin access required"))
  }
  next()
}
