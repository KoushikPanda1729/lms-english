import { Repository } from "typeorm"
import { User } from "../../entities/User.entity"
import { Profile } from "../../entities/Profile.entity"
import { RefreshToken } from "../../entities/RefreshToken.entity"
import { Report } from "../../entities/Report.entity"
import { CallSession } from "../../entities/CallSession.entity"
import { UserRole, ReportStatus, NotificationType } from "../../enums/index"
import { NotFoundError, ValidationError } from "../../shared/errors"
import { NotificationService } from "../notifications/notification.service"
import logger from "../../config/logger"

interface ListUsersFilters {
  search?: string
  isBanned?: boolean
  role?: UserRole
  page: number
  limit: number
}

interface UserRow {
  user: User
  profile: Profile | null
  pendingReportsCount: number
}

export class AdminService {
  constructor(
    private readonly userRepo: Repository<User>,
    private readonly profileRepo: Repository<Profile>,
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly reportRepo: Repository<Report>,
    private readonly sessionRepo: Repository<CallSession>,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── GET /admin/users ─────────────────────────────────────────────────────────

  async listUsers(filters: ListUsersFilters): Promise<{
    users: UserRow[]
    total: number
    page: number
    limit: number
  }> {
    const { page, limit, search, isBanned, role } = filters

    const qb = this.userRepo
      .createQueryBuilder("u")
      .leftJoinAndSelect("u.profile", "p")
      .orderBy("u.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)

    if (search) {
      qb.andWhere("(u.email ILIKE :s OR p.displayName ILIKE :s OR p.username ILIKE :s)", {
        s: `%${search}%`,
      })
    }

    if (isBanned !== undefined) {
      qb.andWhere("u.isBanned = :isBanned", { isBanned })
    }

    if (role) {
      qb.andWhere("u.role = :role", { role })
    }

    const [rawUsers, total] = await qb.getManyAndCount()

    // Fetch pending report counts for listed users in one query
    const userIds = rawUsers.map((u) => u.id)
    const reportCounts =
      userIds.length > 0
        ? await this.reportRepo
            .createQueryBuilder("r")
            .select("r.reportedId", "reportedId")
            .addSelect("COUNT(*)", "count")
            .where("r.reportedId IN (:...ids)", { ids: userIds })
            .andWhere("r.status = :status", { status: ReportStatus.PENDING })
            .groupBy("r.reportedId")
            .getRawMany<{ reportedId: string; count: string }>()
        : []

    const countMap = new Map(reportCounts.map((r) => [r.reportedId, Number(r.count)]))

    const users: UserRow[] = rawUsers.map((u) => ({
      user: u,
      profile: (u as User & { profile?: Profile }).profile ?? null,
      pendingReportsCount: countMap.get(u.id) ?? 0,
    }))

    return { users, total, page, limit }
  }

  // ─── GET /admin/users/:id ─────────────────────────────────────────────────────

  async getUserDetail(userId: string): Promise<{
    user: User
    profile: Profile | null
    pendingReportsCount: number
    totalReportsCount: number
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundError("User not found")

    const profile = await this.profileRepo.findOne({ where: { userId } })

    const [pendingReportsCount, totalReportsCount] = await Promise.all([
      this.reportRepo.count({ where: { reportedId: userId, status: ReportStatus.PENDING } }),
      this.reportRepo.count({ where: { reportedId: userId } }),
    ])

    return { user, profile, pendingReportsCount, totalReportsCount }
  }

  // ─── PATCH /admin/users/:id/ban ───────────────────────────────────────────────

  async setUserBanned(userId: string, banned: boolean): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundError("User not found")

    if (user.role === UserRole.ADMIN) {
      throw new ValidationError("Cannot ban an admin account")
    }

    user.isBanned = banned
    await this.userRepo.save(user)

    if (banned) {
      // Revoke all sessions — forces logout on all devices immediately
      await this.refreshTokenRepo.update(
        { userId, revoked: false },
        { revoked: true, revokedAt: new Date() },
      )
      logger.info(`User ${userId} banned by admin`)
    } else {
      logger.info(`User ${userId} unbanned by admin`)
    }

    return user
  }

  // ─── PATCH /admin/users/:id/role ──────────────────────────────────────────────

  async setUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundError("User not found")

    user.role = role
    await this.userRepo.save(user)

    logger.info(`User ${userId} role set to ${role} by admin`)
    return user
  }

  // ─── GET /admin/stats ─────────────────────────────────────────────────────────

  async getStats(): Promise<{
    totalUsers: number
    bannedUsers: number
    totalSessions: number
    sessionsToday: number
    activeReports: number
  }> {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [totalUsers, bannedUsers, totalSessions, sessionsToday, activeReports] =
      await Promise.all([
        this.userRepo.count(),
        this.userRepo.count({ where: { isBanned: true } }),
        this.sessionRepo.count(),
        this.sessionRepo
          .createQueryBuilder("s")
          .where("s.startedAt >= :todayStart", { todayStart })
          .getCount(),
        this.reportRepo.count({ where: { status: ReportStatus.PENDING } }),
      ])

    return { totalUsers, bannedUsers, totalSessions, sessionsToday, activeReports }
  }

  // ─── POST /admin/notifications ────────────────────────────────────────────────

  async sendNotification(
    target: "all" | "user",
    title: string,
    body: string,
    userIds?: string[],
  ): Promise<{ sent: number }> {
    const dto = { type: NotificationType.SYSTEM, title, body }

    if (target === "user") {
      if (!userIds || !userIds.length)
        throw new ValidationError("userIds is required when target is 'user'")

      // Verify all user IDs exist
      const users = await this.userRepo
        .createQueryBuilder("u")
        .select("u.id")
        .where("u.id IN (:...ids)", { ids: userIds })
        .getMany()

      if (!users.length) throw new NotFoundError("No users found for the given IDs")

      await Promise.allSettled(users.map((u) => this.notificationService.sendToUser(u.id, dto)))
      logger.info(`Admin notification sent to ${users.length} specific user(s)`)
      return { sent: users.length }
    }

    // target === 'all' — fetch all user IDs (lightweight, id only)
    const users = await this.userRepo.find({ select: { id: true } })
    if (!users.length) return { sent: 0 }

    // Send in batches of 50 to avoid overwhelming the system
    const BATCH = 50
    for (let i = 0; i < users.length; i += BATCH) {
      const batch = users.slice(i, i + BATCH)
      await Promise.allSettled(batch.map((u) => this.notificationService.sendToUser(u.id, dto)))
    }

    logger.info(`Admin broadcast notification sent to ${users.length} users`)
    return { sent: users.length }
  }
}
