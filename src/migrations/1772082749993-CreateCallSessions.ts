import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateCallSessions1772082749993 implements MigrationInterface {
  name = "CreateCallSessions1772082749993"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "call_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" character varying NOT NULL, "user_a_id" uuid NOT NULL, "user_b_id" uuid NOT NULL, "topic" character varying, "level" character varying, "started_at" TIMESTAMP NOT NULL, "ended_at" TIMESTAMP, "duration_seconds" integer, "ended_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b5ba4a8e40e97b3eb6062f4730e" UNIQUE ("room_id"), CONSTRAINT "PK_43019a4ddb87c365c3d13fbe9e0" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "session_ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "rater_id" uuid NOT NULL, "rated_id" uuid NOT NULL, "stars" smallint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_16a9e4e2451a24197061023306d" UNIQUE ("session_id", "rater_id"), CONSTRAINT "PK_d10dbf6d5a6b9ecd1c6229cd8ca" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "call_sessions" ADD CONSTRAINT "FK_1c17a98a67a735980571f971a4e" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "call_sessions" ADD CONSTRAINT "FK_6d0da5f7623c5d63018316ebbb1" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "call_sessions" ADD CONSTRAINT "FK_02fbd245265b20ff317f285b00b" FOREIGN KEY ("ended_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "session_ratings" ADD CONSTRAINT "FK_524471d5778c38e7100969a0741" FOREIGN KEY ("session_id") REFERENCES "call_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "session_ratings" ADD CONSTRAINT "FK_f65ab4a7fefe9895332f681a247" FOREIGN KEY ("rater_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "session_ratings" ADD CONSTRAINT "FK_0de2116119e92c8c963c59def94" FOREIGN KEY ("rated_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "session_ratings" DROP CONSTRAINT "FK_0de2116119e92c8c963c59def94"`,
    )
    await queryRunner.query(
      `ALTER TABLE "session_ratings" DROP CONSTRAINT "FK_f65ab4a7fefe9895332f681a247"`,
    )
    await queryRunner.query(
      `ALTER TABLE "session_ratings" DROP CONSTRAINT "FK_524471d5778c38e7100969a0741"`,
    )
    await queryRunner.query(
      `ALTER TABLE "call_sessions" DROP CONSTRAINT "FK_02fbd245265b20ff317f285b00b"`,
    )
    await queryRunner.query(
      `ALTER TABLE "call_sessions" DROP CONSTRAINT "FK_6d0da5f7623c5d63018316ebbb1"`,
    )
    await queryRunner.query(
      `ALTER TABLE "call_sessions" DROP CONSTRAINT "FK_1c17a98a67a735980571f971a4e"`,
    )
    await queryRunner.query(`DROP TABLE "session_ratings"`)
    await queryRunner.query(`DROP TABLE "call_sessions"`)
  }
}
