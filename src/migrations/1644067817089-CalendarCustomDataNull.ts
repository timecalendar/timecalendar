import { MigrationInterface, QueryRunner } from "typeorm"

export class CalendarCustomDataNull1644067817089 implements MigrationInterface {
  name = "CalendarCustomDataNull1644067817089"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`calendar\` CHANGE \`customData\` \`customData\` longtext NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`calendar\` CHANGE \`customData\` \`customData\` longtext NOT NULL`,
    )
  }
}
