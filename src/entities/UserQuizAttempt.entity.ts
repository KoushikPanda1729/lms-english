import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { User } from "./User.entity"
import { Quiz } from "./Quiz.entity"

@Entity("user_quiz_attempts")
export class UserQuizAttempt {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ name: "user_id", type: "uuid" })
  userId!: string

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User

  @Column({ name: "quiz_id", type: "uuid" })
  quizId!: string

  @ManyToOne(() => Quiz, { onDelete: "CASCADE" })
  @JoinColumn({ name: "quiz_id" })
  quiz!: Quiz

  // { questionId: string, selectedOptionIds: string[] }[]
  @Column({ type: "jsonb" })
  answers!: { questionId: string; selectedOptionIds: string[] }[]

  @Column({ name: "score", type: "integer" })
  score!: number

  @Column({ name: "passed", default: false })
  passed!: boolean

  @CreateDateColumn({ name: "attempted_at" })
  attemptedAt!: Date
}
