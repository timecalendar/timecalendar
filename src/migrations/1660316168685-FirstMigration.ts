import { MigrationInterface, QueryRunner } from "typeorm"

export class FirstMigration1660316168685 implements MigrationInterface {
  name = "FirstMigration1660316168685"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "calendar_content" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "events" json NOT NULL, "calendarId" uuid, CONSTRAINT "REL_faa565857e57a80808a1fa88b9" UNIQUE ("calendarId"), CONSTRAINT "PK_4495012677a88a44a1c4440d1a2" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "school" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "siteUrl" character varying NOT NULL, "imageUrl" character varying NOT NULL, "intranetUrl" character varying, "visible" boolean NOT NULL DEFAULT true, "assistant" character varying NOT NULL, "fallbackAssistant" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_57836c3fe2f2c7734b20911755e" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "calendar" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "schoolName" character varying, "url" character varying NOT NULL, "customData" json, "lastUpdatedAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "schoolId" uuid, CONSTRAINT "PK_2492fb846a48ea16d53864e3267" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "calendar_subject" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subjects" json NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "calendarId" uuid, CONSTRAINT "REL_7c6f1d18da1f0b13ebc0895278" UNIQUE ("calendarId"), CONSTRAINT "PK_1d3f825ded7daa891e1e391ea7b" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_content" ADD CONSTRAINT "FK_faa565857e57a80808a1fa88b9e" FOREIGN KEY ("calendarId") REFERENCES "calendar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar" ADD CONSTRAINT "FK_86242fdc64a69591b0adfed91c1" FOREIGN KEY ("schoolId") REFERENCES "school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_subject" ADD CONSTRAINT "FK_7c6f1d18da1f0b13ebc0895278f" FOREIGN KEY ("calendarId") REFERENCES "calendar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar_subject" DROP CONSTRAINT "FK_7c6f1d18da1f0b13ebc0895278f"`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar" DROP CONSTRAINT "FK_86242fdc64a69591b0adfed91c1"`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_content" DROP CONSTRAINT "FK_faa565857e57a80808a1fa88b9e"`,
    )
    await queryRunner.query(`DROP TABLE "calendar_subject"`)
    await queryRunner.query(`DROP TABLE "calendar"`)
    await queryRunner.query(`DROP TABLE "school"`)
    await queryRunner.query(`DROP TABLE "calendar_content"`)
  }
}
