import { MigrationInterface, QueryRunner } from "typeorm"

export class Migration1757002345458 implements MigrationInterface {
  name = "Migration1757002345458"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "school_profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "campuses" json, "formations" json, "description" text, "studentCount" integer, "domains" json, "excellenceTitle" character varying, "excellenceDescription" text, "tags" json, "campusLocationContext" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "schoolId" uuid NOT NULL, CONSTRAINT "REL_3eb27aef4fc617380eee863ddb" UNIQUE ("schoolId"), CONSTRAINT "PK_bb0313d4bc2957cfb49ceb9611e" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "school_profile" ADD CONSTRAINT "FK_3eb27aef4fc617380eee863ddb7" FOREIGN KEY ("schoolId") REFERENCES "school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "school_profile" DROP CONSTRAINT "FK_3eb27aef4fc617380eee863ddb7"`,
    )
    await queryRunner.query(`DROP TABLE "school_profile"`)
  }
}
