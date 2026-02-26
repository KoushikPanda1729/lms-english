import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateLmsTables1772098688293 implements MigrationInterface {
  name = "CreateLmsTables1772098688293"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."quiz_question_type_enum" AS ENUM('single', 'multiple')`,
    )
    await queryRunner.query(
      `CREATE TABLE "quiz_questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quiz_id" uuid NOT NULL, "question" text NOT NULL, "type" "public"."quiz_question_type_enum" NOT NULL DEFAULT 'single', "order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_ec0447fd30d9f5c182e7653bfd3" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "quiz_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question_id" uuid NOT NULL, "text" text NOT NULL, "is_correct" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9c59607f100085ab17f0f138926" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "quizzes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lesson_id" uuid NOT NULL, "title" character varying NOT NULL, "passing_score" integer NOT NULL DEFAULT '70', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2cf4e4b5b533af8dc6b38d4fa9b" UNIQUE ("lesson_id"), CONSTRAINT "REL_2cf4e4b5b533af8dc6b38d4fa9" UNIQUE ("lesson_id"), CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."lessons_type_enum" AS ENUM('video', 'pdf', 'text', 'quiz')`,
    )
    await queryRunner.query(
      `CREATE TABLE "lessons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "course_id" uuid NOT NULL, "title" character varying NOT NULL, "type" "public"."lessons_type_enum" NOT NULL DEFAULT 'text', "content" text, "video_url" character varying, "pdf_url" character varying, "order" integer NOT NULL DEFAULT '0', "duration_minutes" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9b9a8d455cac672d262d7275730" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."courses_level_enum" AS ENUM('beginner', 'intermediate', 'advanced')`,
    )
    await queryRunner.query(
      `CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "thumbnail_url" character varying, "level" "public"."courses_level_enum", "is_premium" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "total_lessons" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "user_quiz_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "quiz_id" uuid NOT NULL, "answers" jsonb NOT NULL, "score" integer NOT NULL, "passed" boolean NOT NULL DEFAULT false, "attempted_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b6822902aa755e9270de5f999cd" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "user_lesson_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "lesson_id" uuid NOT NULL, "completed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ca7535b366966615043ad206d59" UNIQUE ("user_id", "lesson_id"), CONSTRAINT "PK_2d52c2d4b5f26e61b3169d3d01a" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "user_course_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "course_id" uuid NOT NULL, "completed_lessons" integer NOT NULL DEFAULT '0', "progress_percent" integer NOT NULL DEFAULT '0', "completed_at" TIMESTAMP, "enrolled_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7bc0d0c362c5a8d504c0973f939" UNIQUE ("user_id", "course_id"), CONSTRAINT "PK_3378f7ec046e4aa16d39fd88f00" PRIMARY KEY ("id"))`,
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
      `ALTER TABLE "quiz_questions" ADD CONSTRAINT "FK_14c6d2b8f5be0bdb406a3895bb4" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "quiz_options" ADD CONSTRAINT "FK_2aa44934a4602aef1ede068f4a7" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_2cf4e4b5b533af8dc6b38d4fa9b" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_quiz_attempts" ADD CONSTRAINT "FK_7beb004d2c0bdb791b188c960cd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_quiz_attempts" ADD CONSTRAINT "FK_3723d1bcb047d125a55663e6c6b" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "FK_5ce08039490cd0e619ae9560519" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "FK_4427002dcf362d61def4791adee" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_course_progress" ADD CONSTRAINT "FK_18e3b602ceda435e7324273e9aa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_course_progress" ADD CONSTRAINT "FK_24f1d238b8a6c2108c5f82b5775" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_course_progress" DROP CONSTRAINT "FK_24f1d238b8a6c2108c5f82b5775"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_course_progress" DROP CONSTRAINT "FK_18e3b602ceda435e7324273e9aa"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_lesson_progress" DROP CONSTRAINT "FK_4427002dcf362d61def4791adee"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_lesson_progress" DROP CONSTRAINT "FK_5ce08039490cd0e619ae9560519"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_quiz_attempts" DROP CONSTRAINT "FK_3723d1bcb047d125a55663e6c6b"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_quiz_attempts" DROP CONSTRAINT "FK_7beb004d2c0bdb791b188c960cd"`,
    )
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe"`,
    )
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "FK_2cf4e4b5b533af8dc6b38d4fa9b"`,
    )
    await queryRunner.query(
      `ALTER TABLE "quiz_options" DROP CONSTRAINT "FK_2aa44934a4602aef1ede068f4a7"`,
    )
    await queryRunner.query(
      `ALTER TABLE "quiz_questions" DROP CONSTRAINT "FK_14c6d2b8f5be0bdb406a3895bb4"`,
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
    await queryRunner.query(`DROP TABLE "user_course_progress"`)
    await queryRunner.query(`DROP TABLE "user_lesson_progress"`)
    await queryRunner.query(`DROP TABLE "user_quiz_attempts"`)
    await queryRunner.query(`DROP TABLE "courses"`)
    await queryRunner.query(`DROP TYPE "public"."courses_level_enum"`)
    await queryRunner.query(`DROP TABLE "lessons"`)
    await queryRunner.query(`DROP TYPE "public"."lessons_type_enum"`)
    await queryRunner.query(`DROP TABLE "quizzes"`)
    await queryRunner.query(`DROP TABLE "quiz_options"`)
    await queryRunner.query(`DROP TABLE "quiz_questions"`)
    await queryRunner.query(`DROP TYPE "public"."quiz_question_type_enum"`)
  }
}
