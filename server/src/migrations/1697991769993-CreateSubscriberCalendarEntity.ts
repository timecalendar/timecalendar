import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateSubscriberCalendarEntity1697991769993
  implements MigrationInterface
{
  name = "CreateSubscriberCalendarEntity1697991769993"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "subscriber_calendar" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subscriberId" uuid NOT NULL, "calendarId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_219646362f159638d115ee50d9a" UNIQUE ("subscriberId", "calendarId"), CONSTRAINT "PK_f0d4e88fb661262a6be1cd5a851" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "subscriber_calendar" ADD CONSTRAINT "FK_8ffc05eec9159f5f8579ef3fcdd" FOREIGN KEY ("subscriberId") REFERENCES "subscriber"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "subscriber_calendar" ADD CONSTRAINT "FK_f5ef7709f97982b1147b5a468c4" FOREIGN KEY ("calendarId") REFERENCES "calendar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriber_calendar" DROP CONSTRAINT "FK_f5ef7709f97982b1147b5a468c4"`,
    )
    await queryRunner.query(
      `ALTER TABLE "subscriber_calendar" DROP CONSTRAINT "FK_8ffc05eec9159f5f8579ef3fcdd"`,
    )
    await queryRunner.query(`DROP TABLE "subscriber_calendar"`)
  }
}
