/**
 * seed-admin.ts
 *
 * Creates the first admin user from environment variables.
 * Safe to run multiple times — skips if the email already exists.
 *
 * Usage:
 *   npm run seed:admin
 *
 * Required env vars (add to .env.development):
 *   ADMIN_EMAIL=admin@yourapp.com
 *   ADMIN_PASSWORD=SuperSecret123!
 *   ADMIN_FIRST_NAME=Super      (optional)
 *   ADMIN_LAST_NAME=Admin       (optional)
 */

import "reflect-metadata"
import bcrypt from "bcrypt"
import { AppDataSource } from "../config/database.config"
import { User } from "../entities/User.entity"
import { Profile } from "../entities/Profile.entity"
import { UserRole } from "../enums/index"
import { Config } from "../config/config"

async function seedAdmin(): Promise<void> {
  // ── Validate required env vars ────────────────────────────────────────────
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME } = Config

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file.")
    process.exit(1)
  }

  const passwordMinLength = 8
  if (ADMIN_PASSWORD.length < passwordMinLength) {
    console.error(`ERROR: ADMIN_PASSWORD must be at least ${passwordMinLength} characters.`)
    process.exit(1)
  }

  // ── Connect to DB ─────────────────────────────────────────────────────────
  console.log("Connecting to database…")
  await AppDataSource.initialize()
  console.log("Connected.")

  try {
    const userRepo = AppDataSource.getRepository(User)
    const profileRepo = AppDataSource.getRepository(Profile)

    // ── Idempotency check ─────────────────────────────────────────────────
    const existing = await userRepo.findOne({ where: { email: ADMIN_EMAIL } })

    if (existing) {
      if (existing.role === UserRole.ADMIN) {
        console.log(`Admin already exists: ${ADMIN_EMAIL} — nothing to do.`)
      } else {
        // User exists but isn't admin — upgrade role
        await userRepo.update(existing.id, { role: UserRole.ADMIN, isVerified: true })
        console.log(`Upgraded existing user to admin: ${ADMIN_EMAIL}`)
      }
      return
    }

    // ── Create admin user + profile in one transaction ────────────────────
    await AppDataSource.transaction(async (manager) => {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

      const user = manager.create(User, {
        email: ADMIN_EMAIL,
        passwordHash,
        role: UserRole.ADMIN,
        isVerified: true,
      })
      await manager.save(user)

      const displayName =
        ADMIN_FIRST_NAME && ADMIN_LAST_NAME
          ? `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`
          : ADMIN_FIRST_NAME || null

      const profile = manager.create(Profile, {
        userId: user.id,
        displayName,
      })
      await manager.save(profile)

      console.log(`Admin created successfully!`)
      console.log(`  Email : ${ADMIN_EMAIL}`)
      console.log(`  Role  : ${UserRole.ADMIN}`)
      if (displayName) console.log(`  Name  : ${displayName}`)
    })
  } finally {
    await AppDataSource.destroy()
    console.log("Database connection closed.")
  }
}

seedAdmin().catch((err) => {
  console.error("Seeding failed:", err)
  process.exit(1)
})
