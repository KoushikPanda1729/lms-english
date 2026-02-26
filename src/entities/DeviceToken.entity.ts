import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm"
import { User } from "./User.entity"
import { Platform } from "../enums/index"

@Unique(["userId", "deviceId"])
@Entity("device_tokens")
export class DeviceToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ name: "user_id", type: "uuid" })
  userId!: string

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User

  @Column({ name: "fcm_token", type: "text" })
  fcmToken!: string

  @Column({ name: "device_id", type: "varchar" })
  deviceId!: string

  // ios | android only (web uses sockets, not FCM)
  @Column({ type: "enum", enum: Platform, enumName: "device_tokens_platform_enum" })
  platform!: Platform

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date
}
