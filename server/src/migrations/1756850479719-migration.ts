import { MigrationInterface, QueryRunner } from "typeorm"

export class Migration1756850479719 implements MigrationInterface {
  name = "Migration1756850479719"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "school" ADD "seoUrl" text`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "school" DROP COLUMN "seoUrl"`)
  }
}
