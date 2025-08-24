import { MigrationInterface, QueryRunner } from "typeorm"

export class Migration1756037050788 implements MigrationInterface {
  name = "Migration1756037050788"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar_log" DROP COLUMN "calendarChange"`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_log" ADD "calendarChange" json NOT NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar_log" DROP COLUMN "calendarChange"`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_log" ADD "calendarChange" character varying NOT NULL`,
    )
  }
}
