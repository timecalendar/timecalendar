import { MigrationInterface, QueryRunner } from "typeorm"

export class Migration1787850619167 implements MigrationInterface {
  name = "Migration1787850619167"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "school" ADD "imageUrlDark" character varying`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "school" DROP COLUMN "imageUrlDark"`)
  }
}
