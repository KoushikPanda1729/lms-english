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
import { Lesson } from "./Lesson.entity"

@Entity("user_lesson_progress")
@Unique(["userId", "lessonId"])
export class UserLessonProgress {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ name: "user_id", type: "uuid" })
  userId!: string

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User

  @Column({ name: "lesson_id", type: "uuid" })
  lessonId!: string

  @ManyToOne(() => Lesson, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lesson_id" })
  lesson!: Lesson

  @CreateDateColumn({ name: "completed_at" })
  completedAt!: Date
}
