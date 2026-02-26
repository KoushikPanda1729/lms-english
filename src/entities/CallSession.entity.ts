import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { User } from "./User.entity"

@Entity("call_sessions")
export class CallSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ name: "room_id", type: "varchar", unique: true })
  roomId!: string

  @Column({ name: "user_a_id", type: "uuid" })
  userAId!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_a_id" })
  userA!: User

  @Column({ name: "user_b_id", type: "uuid" })
  userBId!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_b_id" })
  userB!: User

  @Column({ nullable: true, type: "varchar" })
  topic!: string | null

  @Column({ nullable: true, type: "varchar" })
  level!: string | null

  @Column({ name: "started_at", type: "timestamp" })
  startedAt!: Date

  @Column({ name: "ended_at", nullable: true, type: "timestamp" })
  endedAt!: Date | null

  @Column({ name: "duration_seconds", nullable: true, type: "integer" })
  durationSeconds!: number | null

  // Which user ended the call — null means timeout/error/unknown
  @Column({ name: "ended_by_id", nullable: true, type: "uuid" })
  endedById!: string | null

  @ManyToOne(() => User)
  @JoinColumn({ name: "ended_by_id" })
  endedBy!: User | null

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date
}
