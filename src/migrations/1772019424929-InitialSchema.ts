import { MigrationInterface, QueryRunner } from "typeorm"

export class InitialSchema1772019424929 implements MigrationInterface {
  name = "InitialSchema1772019424929"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('student', 'admin')`)
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'student', "is_verified" boolean NOT NULL DEFAULT false, "is_banned" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."refresh_tokens_platform_enum" AS ENUM('ios', 'android', 'web')`,
    )
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token_hash" character varying NOT NULL, "device_id" character varying NOT NULL, "platform" "public"."refresh_tokens_platform_enum" NOT NULL DEFAULT 'web', "expires_at" TIMESTAMP NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "revoked_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a7838d2ba25be1342091b6695f1" UNIQUE ("token_hash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token_hash" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_91185d86d5d7557b19abbb2868b" UNIQUE ("token_hash"), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c"`,
    )
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    )
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`)
    await queryRunner.query(`DROP TABLE "refresh_tokens"`)
    await queryRunner.query(`DROP TYPE "public"."refresh_tokens_platform_enum"`)
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`)
  }
}
