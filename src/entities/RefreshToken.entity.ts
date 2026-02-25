import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { User } from "./User.entity"
import { Platform } from "../enums/index"

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User

  @Column({ name: "user_id" })
  userId!: string

  @Column({ name: "token_hash", unique: true })
  tokenHash!: string

  @Column({ name: "device_id" })
  deviceId!: string

  @Column({ type: "enum", enum: Platform, default: Platform.WEB })
  platform!: Platform

  @Column({ name: "expires_at" })
  expiresAt!: Date

  @Column({ default: false })
  revoked!: boolean

  @Column({ name: "revoked_at", nullable: true, type: "timestamp" })
  revokedAt!: Date | null

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date
}
