import { MigrationInterface, QueryRunner } from "typeorm"

export class FirstMigration1641146096855 implements MigrationInterface {
  name = "FirstMigration1641146096855"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`school\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`siteUrl\` varchar(255) NOT NULL, \`visible\` tinyint NOT NULL, \`assistant\` varchar(255) NOT NULL, \`fallbackAssistant\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`calendar\` (\`id\` varchar(36) NOT NULL, \`token\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`schoolName\` varchar(255) NOT NULL, \`url\` varchar(255) NOT NULL, \`customData\` longtext NOT NULL, \`lastUpdatedAt\` datetime NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`schoolId\` varchar(36) NULL, UNIQUE INDEX \`IDX_f1e34ed082e59a751c045963d4\` (\`token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`calendar\` ADD CONSTRAINT \`FK_86242fdc64a69591b0adfed91c1\` FOREIGN KEY (\`schoolId\`) REFERENCES \`school\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`calendar\` DROP FOREIGN KEY \`FK_86242fdc64a69591b0adfed91c1\``,
    )
    await queryRunner.query(
      `DROP INDEX \`IDX_f1e34ed082e59a751c045963d4\` ON \`calendar\``,
    )
    await queryRunner.query(`DROP TABLE \`calendar\``)
    await queryRunner.query(`DROP TABLE \`school\``)
  }
}
