import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from "typeorm"
import type { Lesson } from "./Lesson.entity"
import type { QuizQuestion } from "./QuizQuestion.entity"

@Entity("quizzes")
export class Quiz {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ name: "lesson_id", type: "uuid", unique: true })
  lessonId!: string

  @OneToOne("Lesson", (lesson: Lesson) => lesson.quiz, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lesson_id" })
  lesson!: Lesson

  @Column({ type: "varchar" })
  title!: string

  @Column({ name: "passing_score", type: "integer", default: 70 })
  passingScore!: number

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @OneToMany("QuizQuestion", (q: QuizQuestion) => q.quiz, { cascade: true })
  questions!: QuizQuestion[]
}
