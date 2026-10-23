import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateMigrationReport1792757532467 implements MigrationInterface {
  name = "CreateMigrationReport1792757532467"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "migration_report" ("reportId" uuid NOT NULL, "schemaVersion" integer NOT NULL, "platform" character varying NOT NULL, "targetAppVersion" character varying NOT NULL, "targetBuild" character varying NOT NULL, "sourceAppVersion" character varying, "sourceDatabaseVersion" integer, "osMajorVersion" integer NOT NULL, "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "completedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "durationMs" integer NOT NULL, "attemptCount" integer NOT NULL, "outcome" character varying NOT NULL, "reason" character varying NOT NULL, "datasets" jsonb NOT NULL, "errors" jsonb NOT NULL, "examplesTruncated" boolean NOT NULL, "calendarIds" jsonb NOT NULL, "calendarIdsTruncated" boolean NOT NULL, "receivedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_39a0a3bcdc4e32cdce0f687129f" PRIMARY KEY ("reportId"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "migration_report"`)
  }
}
