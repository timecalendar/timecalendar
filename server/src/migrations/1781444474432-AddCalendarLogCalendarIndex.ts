import { MigrationInterface, QueryRunner } from "typeorm"

export class AddCalendarLogCalendarIndex1781444474432
  implements MigrationInterface
{
  name = "AddCalendarLogCalendarIndex1781444474432"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_calendar_log_calendar_createdAt" ON "calendar_log" ("calendarId", "createdAt") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_calendar_log_calendar_createdAt"`,
    )
  }
}
