import bcrypt from "bcrypt"
import { v4 as uuidv4 } from "uuid"
import { createHash } from "crypto"
import { Repository } from "typeorm"
import { User } from "../../entities/User.entity"
import { RefreshToken } from "../../entities/RefreshToken.entity"
import { PasswordResetToken } from "../../entities/PasswordResetToken.entity"
import { UserRole } from "../../enums/index"
import { Platform } from "../../enums/index"
import { signAccessToken } from "./jwt.util"
import { ConflictError, UnauthorizedError, ValidationError } from "../../shared/errors"
import { Config } from "../../config/config"
import type { RegisterParams, LoginParams, TokenPair } from "./interfaces/auth.interface"

export class AuthService {
  constructor(
    private readonly userRepo: Repository<User>,
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly passwordResetTokenRepo: Repository<PasswordResetToken>,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex")
  }

  private parseExpiryToDate(expiry: string): Date {
    const match = expiry.match(/^(\d+)([mhd])$/)
    if (!match) throw new Error(`Invalid expiry format: ${expiry}`)
    const value = Number(match[1])
    const unit = match[2] as "m" | "h" | "d"
    const ms = { m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]
    return new Date(Date.now() + value * ms)
  }

  // ─── Register ──────────────────────────────────────────────────────────────

  async register(params: RegisterParams): Promise<TokenPair> {
    const existing = await this.userRepo.findOne({ where: { email: params.email } })
    if (existing) throw new ConflictError("Email already registered")

    const passwordHash = await bcrypt.hash(params.password, 12)

    const user = this.userRepo.create({
      email: params.email,
      passwordHash,
      role: UserRole.STUDENT,
    })
    await this.userRepo.save(user)

    return this.issueTokens(user, params.deviceId, params.platform)
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(params: LoginParams): Promise<TokenPair> {
    const user = await this.userRepo.findOne({ where: { email: params.email } })

    // Same error for wrong email and wrong password — prevent enumeration
    if (!user) throw new UnauthorizedError("Invalid credentials")
    if (user.isBanned) throw new UnauthorizedError("Account suspended")

    const valid = await bcrypt.compare(params.password, user.passwordHash)
    if (!valid) throw new UnauthorizedError("Invalid credentials")

    return this.issueTokens(user, params.deviceId, params.platform)
  }

  // ─── Refresh ───────────────────────────────────────────────────────────────
  // Note: token is already validated by validateRefreshToken middleware

  async refresh(stored: RefreshToken): Promise<TokenPair> {
    // Rotate — revoke old, issue new
    stored.revoked = true
    stored.revokedAt = new Date()
    await this.refreshTokenRepo.save(stored)

    return this.issueTokens(stored.user, stored.deviceId, stored.platform)
  }

  // ─── Logout ────────────────────────────────────────────────────────────────
  // Note: token is already validated by validateRefreshToken middleware

  async logout(stored: RefreshToken): Promise<void> {
    await this.refreshTokenRepo.update({ id: stored.id }, { revoked: true, revokedAt: new Date() })
  }

  // ─── Forgot password ───────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } })

    // Always return — never reveal if email exists
    if (!user) return

    // Invalidate any previous unused reset tokens
    await this.passwordResetTokenRepo.update({ userId: user.id, used: false }, { used: true })

    const plainToken = uuidv4()
    const tokenHash = this.hashToken(plainToken)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await this.passwordResetTokenRepo.save(
      this.passwordResetTokenRepo.create({ userId: user.id, tokenHash, expiresAt }),
    )

    // TODO: send email — emailService.sendPasswordReset(email, plainToken)
    // Dev only: log to console
    if (Config.NODE_ENV === "development") {
      console.log(`\n🔑  Password reset token for ${email}:`)
      console.log(`    ${Config.APP_URL}/reset-password?token=${plainToken}\n`)
    }
  }

  // ─── Reset password ────────────────────────────────────────────────────────

  async resetPassword(plainToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(plainToken)

    const resetToken = await this.passwordResetTokenRepo.findOne({
      where: { tokenHash },
      relations: ["user"],
    })

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new ValidationError("Invalid or expired reset token")
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await this.userRepo.update(resetToken.userId, { passwordHash })

    resetToken.used = true
    await this.passwordResetTokenRepo.save(resetToken)

    // Revoke all refresh tokens — force re-login on all devices
    await this.refreshTokenRepo.update(
      { userId: resetToken.userId, revoked: false },
      { revoked: true, revokedAt: new Date() },
    )
  }

  // ─── Self ──────────────────────────────────────────────────────────────────

  async self(userId: string): Promise<Omit<User, "passwordHash">> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedError("User not found")
    const { passwordHash: _pw, ...safe } = user
    return safe
  }

  // ─── Private: issue token pair ─────────────────────────────────────────────

  private async issueTokens(user: User, deviceId: string, platform: Platform): Promise<TokenPair> {
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    const plainRefreshToken = uuidv4()
    const tokenHash = this.hashToken(plainRefreshToken)
    const expiresAt = this.parseExpiryToDate(Config.JWT_REFRESH_EXPIRY)

    // One active session per device — revoke previous token for this device
    await this.refreshTokenRepo.update(
      { userId: user.id, deviceId, revoked: false },
      { revoked: true, revokedAt: new Date() },
    )

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId: user.id,
        tokenHash,
        deviceId,
        platform,
        expiresAt,
      }),
    )

    return {
      accessToken,
      refreshToken: plainRefreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    }
  }
}
