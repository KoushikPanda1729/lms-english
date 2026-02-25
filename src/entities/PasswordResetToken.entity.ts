import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { User } from "./User.entity"

@Entity("password_reset_tokens")
export class PasswordResetToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User

  @Column({ name: "user_id" })
  userId!: string

  @Column({ name: "token_hash", unique: true })
  tokenHash!: string

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt!: Date

  @Column({ default: false })
  used!: boolean

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date
}
