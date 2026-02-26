import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import type { QuizQuestion } from "./QuizQuestion.entity"

@Entity("quiz_options")
export class QuizOption {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ name: "question_id", type: "uuid" })
  questionId!: string

  @ManyToOne("QuizQuestion", (q: QuizQuestion) => q.options, { onDelete: "CASCADE" })
  @JoinColumn({ name: "question_id" })
  question!: QuizQuestion

  @Column({ type: "text" })
  text!: string

  @Column({ name: "is_correct", default: false })
  isCorrect!: boolean
}
