import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateCalendarFailureEntity1693778453903
  implements MigrationInterface
{
  name = "CreateCalendarFailureEntity1693778453903"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "calendar_failure" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "error" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0e8a1d1520f315ce879e594f774" PRIMARY KEY ("id"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "calendar_failure"`)
  }
}
