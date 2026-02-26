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
import { Course } from "./Course.entity"

@Entity("user_course_progress")
@Unique(["userId", "courseId"])
export class UserCourseProgress {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ name: "user_id", type: "uuid" })
  userId!: string

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User

  @Column({ name: "course_id", type: "uuid" })
  courseId!: string

  @ManyToOne(() => Course, { onDelete: "CASCADE" })
  @JoinColumn({ name: "course_id" })
  course!: Course

  @Column({ name: "completed_lessons", default: 0 })
  completedLessons!: number

  @Column({ name: "progress_percent", type: "integer", default: 0 })
  progressPercent!: number

  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completedAt!: Date | null

  @CreateDateColumn({ name: "enrolled_at" })
  enrolledAt!: Date
}
