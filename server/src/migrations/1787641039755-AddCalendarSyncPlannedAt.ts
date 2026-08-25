import { MigrationInterface, QueryRunner } from "typeorm"

export class AddCalendarSyncPlannedAt1787641039755
  implements MigrationInterface
{
  name = "AddCalendarSyncPlannedAt1787641039755"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar" ADD "syncPlannedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    )
    // Reproduce the behaviour of the global 30-minute throttle this column
    // replaces, so the deploy is neutral at the instant it lands. The 30 is
    // deliberately hardcoded: a migration is frozen history and must not follow
    // a constant that later changes.
    await queryRunner.query(
      `UPDATE "calendar" SET "syncPlannedAt" = "lastUpdatedAt" + interval '30 minutes'`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_calendar_syncPlannedAt" ON "calendar" ("syncPlannedAt") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_calendar_syncPlannedAt"`)
    await queryRunner.query(
      `ALTER TABLE "calendar" DROP COLUMN "syncPlannedAt"`,
    )
  }
}
