import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateSubscriberEntity1697989768353 implements MigrationInterface {
  name = "CreateSubscriberEntity1697989768353"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "subscriber" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "email" text, "firebaseToken" text, "frequency" character varying NOT NULL, "isEnabled" boolean NOT NULL, "notificationDays" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_1c52b7ddbaf79cd2650045b79c7" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b7032d202fc198bd01ae8d9356" ON "subscriber" ("email") WHERE "email" IS NOT NULL`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_aadbc46ee974d5ecc3a2544a6f" ON "subscriber" ("firebaseToken") WHERE "firebaseToken" IS NOT NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aadbc46ee974d5ecc3a2544a6f"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b7032d202fc198bd01ae8d9356"`,
    )
    await queryRunner.query(`DROP TABLE "subscriber"`)
  }
}
