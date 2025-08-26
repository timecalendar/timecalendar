import { MigrationInterface, QueryRunner } from "typeorm"

export class Migration1756235223939 implements MigrationInterface {
  name = "Migration1756235223939"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "feature_flag" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "enabled" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_960310efa932f7a29eec57350b3" UNIQUE ("key"), CONSTRAINT "PK_f390205410d884907604a90c0f4" PRIMARY KEY ("id"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "feature_flag"`)
  }
}
