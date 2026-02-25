import { Request, Response, NextFunction } from "express"
import { AppError } from "../shared/errors"
import { error as errorResponse } from "../shared/response"

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.code, err.message))
    return
  }

  console.error("Unhandled error:", err)
  res.status(500).json(errorResponse("INTERNAL_ERROR", "Something went wrong"))
}
