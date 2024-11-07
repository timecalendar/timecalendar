import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateCalendarLogEntity1697969863868
  implements MigrationInterface
{
  name = "CreateCalendarLogEntity1697969863868"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "calendar_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "calendarChange" json NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "calendarId" uuid, CONSTRAINT "REL_de4563304d05267a24390d9127" UNIQUE ("calendarId"), CONSTRAINT "PK_ece3bc2d15de330733b048aadca" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_log" ADD CONSTRAINT "FK_de4563304d05267a24390d9127b" FOREIGN KEY ("calendarId") REFERENCES "calendar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar_log" DROP CONSTRAINT "FK_de4563304d05267a24390d9127b"`,
    )
    await queryRunner.query(`DROP TABLE "calendar_log"`)
  }
}
