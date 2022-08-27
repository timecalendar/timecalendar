import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateSchoolGroupEntity1661597401599
  implements MigrationInterface
{
  name = "CreateSchoolGroupEntity1661597401599"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "school_group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "groups" json NOT NULL, "icalUrl" text NOT NULL, "schoolId" uuid, CONSTRAINT "REL_9d982dbe6a4b665bace3412433" UNIQUE ("schoolId"), CONSTRAINT "PK_7f52d5dbba93ba26806f370b25c" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "school_group" ADD CONSTRAINT "FK_9d982dbe6a4b665bace3412433f" FOREIGN KEY ("schoolId") REFERENCES "school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "school_group" DROP CONSTRAINT "FK_9d982dbe6a4b665bace3412433f"`,
    )
    await queryRunner.query(`DROP TABLE "school_group"`)
  }
}
