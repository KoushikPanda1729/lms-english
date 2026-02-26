import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateReports1772083338997 implements MigrationInterface {
  name = "CreateReports1772083338997"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."reports_reason_enum" AS ENUM('harassment', 'spam', 'inappropriate', 'hate_speech', 'other')`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."reports_status_enum" AS ENUM('pending', 'reviewed', 'actioned', 'dismissed')`,
    )
    await queryRunner.query(
      `CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reporter_id" uuid NOT NULL, "reported_id" uuid NOT NULL, "session_id" uuid, "reason" "public"."reports_reason_enum" NOT NULL, "description" text, "status" "public"."reports_status_enum" NOT NULL DEFAULT 'pending', "admin_note" text, "actioned_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1db55d9170bf0287e206c27bee5" UNIQUE ("session_id", "reporter_id"), CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "reports" ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "reports" ADD CONSTRAINT "FK_a4f4f08ca7392c630494d1a77f7" FOREIGN KEY ("reported_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "reports" ADD CONSTRAINT "FK_a38d50b0bf81ced11d7c025f316" FOREIGN KEY ("session_id") REFERENCES "call_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_a38d50b0bf81ced11d7c025f316"`,
    )
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_a4f4f08ca7392c630494d1a77f7"`,
    )
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead"`,
    )
    await queryRunner.query(`DROP TABLE "reports"`)
    await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`)
    await queryRunner.query(`DROP TYPE "public"."reports_reason_enum"`)
  }
}
