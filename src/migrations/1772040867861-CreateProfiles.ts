import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateProfiles1772040867861 implements MigrationInterface {
  name = "CreateProfiles1772040867861"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."profiles_english_level_enum" AS ENUM('beginner', 'intermediate', 'advanced')`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."profiles_learning_goal_enum" AS ENUM('fluency', 'business', 'travel', 'exam')`,
    )
    await queryRunner.query(
      `CREATE TABLE "profiles" ("user_id" uuid NOT NULL, "username" character varying, "display_name" character varying, "avatar_url" character varying, "bio" text, "native_language" character varying, "english_level" "public"."profiles_english_level_enum", "learning_goal" "public"."profiles_learning_goal_enum", "country" character varying, "timezone" character varying, "total_practice_mins" integer NOT NULL DEFAULT '0', "total_sessions" integer NOT NULL DEFAULT '0', "streak_days" integer NOT NULL DEFAULT '0', "last_session_at" TIMESTAMP, "last_active_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d1ea35db5be7c08520d70dc03f8" UNIQUE ("username"), CONSTRAINT "PK_9e432b7df0d182f8d292902d1a2" PRIMARY KEY ("user_id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" DROP CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2"`,
    )
    await queryRunner.query(`DROP TABLE "profiles"`)
    await queryRunner.query(`DROP TYPE "public"."profiles_learning_goal_enum"`)
    await queryRunner.query(`DROP TYPE "public"."profiles_english_level_enum"`)
  }
}
