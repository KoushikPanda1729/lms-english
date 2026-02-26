import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm"
import type { Quiz } from "./Quiz.entity"
import type { QuizOption } from "./QuizOption.entity"

export enum QuestionType {
  SINGLE = "single",
  MULTIPLE = "multiple",
}

@Entity("quiz_questions")
export class QuizQuestion {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ name: "quiz_id", type: "uuid" })
  quizId!: string

  @ManyToOne("Quiz", (quiz: Quiz) => quiz.questions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "quiz_id" })
  quiz!: Quiz

  @Column({ type: "text" })
  question!: string

  @Column({
    type: "enum",
    enum: QuestionType,
    default: QuestionType.SINGLE,
    enumName: "quiz_question_type_enum",
  })
  type!: QuestionType

  @Column({ name: "order", type: "integer", default: 0 })
  order!: number

  @OneToMany("QuizOption", (o: QuizOption) => o.question, { cascade: true })
  options!: QuizOption[]
}
