import { Request, Response, NextFunction } from "express"
import { createHash } from "crypto"
import { AppDataSource } from "../config/database.config"
import { RefreshToken } from "../entities/RefreshToken.entity"
import { UnauthorizedError } from "../shared/errors"

export async function validateRefreshToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Web sends via cookie, mobile sends via body
    const plainToken: string | undefined =
      (req.cookies?.refreshToken as string | undefined) ?? req.body?.refreshToken

    if (!plainToken) throw new UnauthorizedError("Refresh token is required")

    const tokenHash = createHash("sha256").update(plainToken).digest("hex")

    const stored = await AppDataSource.getRepository(RefreshToken).findOne({
      where: { tokenHash },
      relations: ["user"],
    })

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedError("Invalid or expired refresh token")
    }

    if (stored.user.isBanned) throw new UnauthorizedError("Account suspended")

    // Attach to request so controller can use it
    req.refreshToken = { plain: plainToken, record: stored }

    next()
  } catch (err) {
    next(err)
  }
}
