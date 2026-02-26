import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { Course } from "./Course.entity"

@Entity("coupons")
export class Coupon {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ unique: true, type: "varchar" })
  code!: string // e.g. "SAVE20"

  @Column({ name: "discount_percent", type: "int" })
  discountPercent!: number // 1–100

  @Column({ name: "course_id", type: "uuid", nullable: true })
  courseId!: string | null

  @ManyToOne(() => Course, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "course_id" })
  course!: Course | null

  @Column({ name: "max_uses", type: "int", nullable: true })
  maxUses!: number | null // null = unlimited

  @Column({ name: "used_count", default: 0 })
  usedCount!: number

  @Column({ name: "expires_at", type: "timestamp", nullable: true })
  expiresAt!: Date | null

  @Column({ name: "is_active", default: true })
  isActive!: boolean

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date
}
