import { MigrationInterface, QueryRunner } from "typeorm"

export class CalendarRemoveTokenAndNullableSchoolName1658431670586
  implements MigrationInterface
{
  name = "CalendarRemoveTokenAndNullableSchoolName1658431670586"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_f1e34ed082e59a751c045963d4\` ON \`calendar\``,
    )
    await queryRunner.query(`ALTER TABLE \`calendar\` DROP COLUMN \`token\``)
    await queryRunner.query(
      `ALTER TABLE \`calendar\` CHANGE \`schoolName\` \`schoolName\` varchar(255) NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`calendar\` CHANGE \`schoolName\` \`schoolName\` varchar(255) NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE \`calendar\` ADD \`token\` varchar(255) NOT NULL`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_f1e34ed082e59a751c045963d4\` ON \`calendar\` (\`token\`)`,
    )
  }
}
