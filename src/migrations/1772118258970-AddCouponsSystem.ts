import { MigrationInterface, QueryRunner } from "typeorm"

export class AddCouponsSystem1772118258970 implements MigrationInterface {
  name = "AddCouponsSystem1772118258970"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "coupons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "discount_percent" integer NOT NULL, "course_id" uuid, "max_uses" integer, "used_count" integer NOT NULL DEFAULT '0', "expires_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e025109230e82925843f2a14c48" UNIQUE ("code"), CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`ALTER TABLE "payments" ADD "coupon_id" uuid`)
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "discount_amount" integer NOT NULL DEFAULT '0'`,
    )
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
    await queryRunner.query(
      `ALTER TABLE "coupons" ADD CONSTRAINT "FK_cbfc36859d6d455581303e85088" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_8aee881c0faac11e56c2bb8f282" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_8aee881c0faac11e56c2bb8f282"`,
    )
    await queryRunner.query(
      `ALTER TABLE "coupons" DROP CONSTRAINT "FK_cbfc36859d6d455581303e85088"`,
    )
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
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "discount_amount"`)
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "coupon_id"`)
    await queryRunner.query(`DROP TABLE "coupons"`)
  }
}
