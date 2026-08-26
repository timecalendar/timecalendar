import { MigrationInterface, QueryRunner } from "typeorm"

export class AddCalendarSyncPlannedAt1787641039755
  implements MigrationInterface
{
  name = "AddCalendarSyncPlannedAt1787641039755"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar" ADD "syncPlannedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    )
    // Give every existing calendar a one-time conservative one-hour floor so
    // the first rollout wave cannot violate Lyon 1's upstream limit. Runtime
    // policy takes over after the next sync (30 minutes for generic sources).
    await queryRunner.query(
      `UPDATE "calendar" SET "syncPlannedAt" = "lastUpdatedAt" + interval '60 minutes'`,
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
