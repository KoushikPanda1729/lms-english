import { Request, Response, NextFunction } from "express"
import { AppError } from "../shared/errors"
import { error as errorResponse } from "../shared/response"
import logger from "../config/logger"

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack })
    }
    res.status(err.statusCode).json(errorResponse(err.code, err.message))
    return
  }

  logger.error("Unhandled error", { error: err.message, stack: err.stack })
  res.status(500).json(errorResponse("INTERNAL_ERROR", "Something went wrong"))
}
