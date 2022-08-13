import { MigrationInterface, QueryRunner } from "typeorm"

export class AddLastAccessedAtToCalendar1660393469858
  implements MigrationInterface
{
  name = "AddLastAccessedAtToCalendar1660393469858"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar" ADD "lastAccessedAt" TIMESTAMP`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar" DROP COLUMN "lastAccessedAt"`,
    )
  }
}
