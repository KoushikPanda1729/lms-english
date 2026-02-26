import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm"
import { User } from "./User.entity"
import { CallSession } from "./CallSession.entity"
import { ReportReason, ReportStatus } from "../enums/index"

@Unique(["sessionId", "reporterId"])
@Entity("reports")
export class Report {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ name: "reporter_id", type: "uuid" })
  reporterId!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "reporter_id" })
  reporter!: User

  @Column({ name: "reported_id", type: "uuid" })
  reportedId!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "reported_id" })
  reported!: User

  @Column({ name: "session_id", type: "uuid", nullable: true })
  sessionId!: string | null

  @ManyToOne(() => CallSession, { nullable: true })
  @JoinColumn({ name: "session_id" })
  session!: CallSession | null

  @Column({ type: "enum", enum: ReportReason })
  reason!: ReportReason

  @Column({ type: "text", nullable: true })
  description!: string | null

  @Column({ type: "enum", enum: ReportStatus, default: ReportStatus.PENDING })
  status!: ReportStatus

  @Column({ name: "admin_note", type: "text", nullable: true })
  adminNote!: string | null

  @Column({ name: "actioned_at", type: "timestamp", nullable: true })
  actionedAt!: Date | null

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date
}
