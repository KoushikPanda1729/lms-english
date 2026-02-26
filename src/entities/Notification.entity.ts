import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { User } from "./User.entity"
import { NotificationType } from "../enums/index"

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ name: "user_id", type: "uuid" })
  userId!: string

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User

  @Column({ type: "enum", enum: NotificationType })
  type!: NotificationType

  @Column({ type: "varchar" })
  title!: string

  @Column({ type: "text" })
  body!: string

  // Deep link payload for Flutter (e.g. { screen: 'session', sessionId: '...' })
  @Column({ type: "jsonb", nullable: true })
  data!: Record<string, unknown> | null

  @Column({ default: false })
  read!: boolean

  @Column({ name: "sent_at", type: "timestamp", nullable: true })
  sentAt!: Date | null

  @Column({ name: "read_at", type: "timestamp", nullable: true })
  readAt!: Date | null

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date
}
