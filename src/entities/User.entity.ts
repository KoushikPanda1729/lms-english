import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from "typeorm"
import { UserRole } from "../enums/index"
import { Profile } from "./Profile.entity"

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ unique: true })
  email!: string

  @Column({ name: "password_hash", nullable: true, type: "varchar" })
  passwordHash!: string | null

  @Column({ name: "google_id", nullable: true, type: "varchar", unique: true })
  googleId!: string | null

  @Column({ type: "enum", enum: UserRole, default: UserRole.STUDENT })
  role!: UserRole

  @Column({ name: "is_verified", default: false })
  isVerified!: boolean

  @Column({ name: "is_banned", default: false })
  isBanned!: boolean

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @OneToOne(() => Profile, (profile) => profile.user)
  profile!: Profile
}
