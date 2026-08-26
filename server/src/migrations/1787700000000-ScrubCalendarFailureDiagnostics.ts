import { MigrationInterface, QueryRunner } from "typeorm"

export class ScrubCalendarFailureDiagnostics1787700000000
  implements MigrationInterface
{
  name = "ScrubCalendarFailureDiagnostics1787700000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" ADD "schoolCode" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" ADD "classification" character varying NOT NULL DEFAULT 'unknown'`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" ADD "helpKey" character varying NOT NULL DEFAULT 'generic_unknown'`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" ADD "retryable" boolean NOT NULL DEFAULT false`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" ADD "errorKind" character varying NOT NULL DEFAULT 'legacy_redacted'`,
    )
    // Dropping is the scrub: raw values are not copied, hashed, or retained.
    await queryRunner.query(`ALTER TABLE "calendar_failure" DROP COLUMN "url"`)
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" DROP COLUMN "error"`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Schema compatibility for an older reader without restoring sensitive
    // content. Constraints intentionally reject any attempted raw write.
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" ADD "error" character varying NOT NULL DEFAULT '[redacted]'`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" ADD "url" character varying NOT NULL DEFAULT '[redacted]'`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" ADD CONSTRAINT "CHK_calendar_failure_error_redacted" CHECK ("error" = '[redacted]')`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" ADD CONSTRAINT "CHK_calendar_failure_url_redacted" CHECK ("url" = '[redacted]')`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" DROP COLUMN "errorKind"`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" DROP COLUMN "retryable"`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" DROP COLUMN "helpKey"`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" DROP COLUMN "classification"`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_failure" DROP COLUMN "schoolCode"`,
    )
  }
}
