import { MigrationInterface, QueryRunner } from "typeorm"

export class AddPaymentForeignKeys1772101161085 implements MigrationInterface {
  name = "AddPaymentForeignKeys1772101161085"

  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "user_id"`)
    await queryRunner.query(`ALTER TABLE "payments" ADD "user_id" uuid NOT NULL`)
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "course_id"`)
    await queryRunner.query(`ALTER TABLE "payments" ADD "course_id" uuid NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_c5fa169d2de9407d99f2c6e4fab" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_c5fa169d2de9407d99f2c6e4fab"`,
    )
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"`,
    )
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "course_id"`)
    await queryRunner.query(`ALTER TABLE "payments" ADD "course_id" character varying NOT NULL`)
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "user_id"`)
    await queryRunner.query(`ALTER TABLE "payments" ADD "user_id" character varying NOT NULL`)
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
  }
}
