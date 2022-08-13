import { MigrationInterface, QueryRunner } from "typeorm"

export class AddTokenToCalendar1660391896967 implements MigrationInterface {
  name = "AddTokenToCalendar1660391896967"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar" ADD "token" character varying NOT NULL`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_f1e34ed082e59a751c045963d4" ON "calendar" ("token") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f1e34ed082e59a751c045963d4"`,
    )
    await queryRunner.query(`ALTER TABLE "calendar" DROP COLUMN "token"`)
  }
}
