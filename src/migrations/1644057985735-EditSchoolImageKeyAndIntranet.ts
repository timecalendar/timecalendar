import { MigrationInterface, QueryRunner } from "typeorm"

export class EditSchoolImageKeyAndIntranet1644057985735
  implements MigrationInterface
{
  name = "EditSchoolImageKeyAndIntranet1644057985735"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`school\` ADD \`imageUrl\` varchar(255) NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE \`school\` ADD \`intranetUrl\` varchar(255) NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE \`school\` CHANGE \`visible\` \`visible\` tinyint NOT NULL DEFAULT 1`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`school\` CHANGE \`visible\` \`visible\` tinyint NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE \`school\` DROP COLUMN \`intranetUrl\``,
    )
    await queryRunner.query(`ALTER TABLE \`school\` DROP COLUMN \`imageUrl\``)
  }
}
