import { MigrationInterface, QueryRunner } from "typeorm"

export class CreatePaymentsTable1772100655965 implements MigrationInterface {
  name = "CreatePaymentsTable1772100655965"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."payment_status_enum" AS ENUM('pending', 'paid', 'failed', 'refunded')`,
    )
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "course_id" character varying NOT NULL, "amount" integer NOT NULL, "currency" character varying NOT NULL DEFAULT 'inr', "status" "public"."payment_status_enum" NOT NULL DEFAULT 'pending', "provider" character varying NOT NULL, "provider_session_id" character varying NOT NULL, "provider_payment_id" character varying, "receipt" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c2a1b9668618a7eda2d2cba91df" UNIQUE ("provider_session_id"), CONSTRAINT "UQ_1a2f1453f65fa247961c4f43af8" UNIQUE ("receipt"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`ALTER TABLE "courses" ADD "price" integer NOT NULL DEFAULT '0'`)
    await queryRunner.query(
      `ALTER TYPE "public"."device_tokens_platform_enum" RENAME TO "device_tokens_platform_enum_old"`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."device_tokens_platform_enum" AS ENUM('ios', 'android', 'web')`,
    )
    await queryRunner.query(
      `ALTER TABLE "device_tokens" ALTER COLUMN "platform" TYPE "public"."device_tokens_platform_enum" USING "platform"::"text"::"public"."device_tokens_platform_enum"`,
    )
    await queryRunner.query(`DROP TYPE "public"."device_tokens_platform_enum_old"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."device_tokens_platform_enum_old" AS ENUM('ios', 'android', 'web')`,
    )
    await queryRunner.query(
      `ALTER TABLE "device_tokens" ALTER COLUMN "platform" TYPE "public"."device_tokens_platform_enum_old" USING "platform"::"text"::"public"."device_tokens_platform_enum_old"`,
    )
    await queryRunner.query(`DROP TYPE "public"."device_tokens_platform_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."device_tokens_platform_enum_old" RENAME TO "device_tokens_platform_enum"`,
    )
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "price"`)
    await queryRunner.query(`DROP TABLE "payments"`)
    await queryRunner.query(`DROP TYPE "public"."payment_status_enum"`)
  }
}
