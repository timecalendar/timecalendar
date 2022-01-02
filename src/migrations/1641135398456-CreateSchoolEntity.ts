import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateSchoolEntity1641135398456 implements MigrationInterface {
  name = "CreateSchoolEntity1641135398456"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`school\` (\`code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`siteUrl\` varchar(255) NOT NULL, \`visible\` tinyint NOT NULL, \`assistant\` varchar(255) NOT NULL, \`fallbackAssistant\` varchar(255) NULL, PRIMARY KEY (\`code\`)) ENGINE=InnoDB`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`school\``)
  }
}
