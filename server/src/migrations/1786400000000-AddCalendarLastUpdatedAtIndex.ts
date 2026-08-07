import { MigrationInterface, QueryRunner } from "typeorm"

export class AddCalendarLastUpdatedAtIndex1786400000000
  implements MigrationInterface
{
  name = "AddCalendarLastUpdatedAtIndex1786400000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_calendar_lastUpdatedAt" ON "calendar" ("lastUpdatedAt") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_calendar_lastUpdatedAt"`)
  }
}
