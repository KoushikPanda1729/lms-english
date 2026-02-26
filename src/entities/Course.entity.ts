import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm"
import { EnglishLevel } from "../enums/index"
import type { Lesson } from "./Lesson.entity"

@Entity("courses")
export class Course {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar" })
  title!: string

  @Column({ type: "text", nullable: true })
  description!: string | null

  @Column({ name: "thumbnail_url", type: "varchar", nullable: true })
  thumbnailUrl!: string | null

  @Column({ type: "enum", enum: EnglishLevel, nullable: true })
  level!: EnglishLevel | null

  @Column({ name: "is_premium", default: false })
  isPremium!: boolean

  @Column({ name: "is_published", default: false })
  isPublished!: boolean

  @Column({ name: "total_lessons", default: 0 })
  totalLessons!: number

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  @OneToMany("Lesson", (lesson: Lesson) => lesson.course)
  lessons!: Lesson[]
}
