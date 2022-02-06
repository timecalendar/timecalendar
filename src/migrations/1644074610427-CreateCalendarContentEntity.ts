import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateCalendarContentEntity1644074610427
  implements MigrationInterface
{
  name = "CreateCalendarContentEntity1644074610427"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`calendar_content\` (\`id\` varchar(36) NOT NULL, \`events\` longtext NOT NULL, \`calendarId\` varchar(36) NULL, UNIQUE INDEX \`REL_faa565857e57a80808a1fa88b9\` (\`calendarId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`calendar_content\` ADD CONSTRAINT \`FK_faa565857e57a80808a1fa88b9e\` FOREIGN KEY (\`calendarId\`) REFERENCES \`calendar\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`calendar_content\` DROP FOREIGN KEY \`FK_faa565857e57a80808a1fa88b9e\``,
    )
    await queryRunner.query(
      `DROP INDEX \`REL_faa565857e57a80808a1fa88b9\` ON \`calendar_content\``,
    )
    await queryRunner.query(`DROP TABLE \`calendar_content\``)
  }
}
