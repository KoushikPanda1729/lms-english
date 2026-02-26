import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { PaymentStatus } from "../enums/payment-status.enum"
import { User } from "./User.entity"
import { Course } from "./Course.entity"
import type { Coupon } from "./Coupon.entity"

@Entity("payments")
export class Payment {
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

  @Column({ type: "int" })
  amount!: number // in smallest currency unit (paise / cents)

  @Column({ type: "varchar", default: "inr" })
  currency!: string

  @Column({
    type: "enum",
    enum: PaymentStatus,
    enumName: "payment_status_enum",
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus

  @Column({ type: "varchar" })
  provider!: string // "stripe" | "razorpay"

  @Column({ name: "provider_session_id", type: "varchar", unique: true })
  providerSessionId!: string // Stripe checkout session ID / Razorpay order ID

  @Column({ name: "provider_payment_id", type: "varchar", nullable: true })
  providerPaymentId!: string | null // Stripe payment intent ID — set on success

  @Column({ name: "coupon_id", type: "uuid", nullable: true })
  couponId!: string | null

  @ManyToOne("Coupon", { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "coupon_id" })
  coupon!: Coupon | null

  @Column({ name: "discount_amount", type: "int", default: 0 })
  discountAmount!: number // paise/cents discounted

  // Idempotency key stored in Redis (24h TTL).
  // receipt = "pay_<userId>_<courseId>_<clientIdempotencyKey>" — also unique in DB
  // so a duplicate webhook can never create two paid records.
  @Column({ type: "varchar", unique: true })
  receipt!: string

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date
}
