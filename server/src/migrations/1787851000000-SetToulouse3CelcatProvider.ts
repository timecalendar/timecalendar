import { MigrationInterface, QueryRunner } from "typeorm"

export class SetToulouse3CelcatProvider1787851000000
  implements MigrationInterface
{
  name = "SetToulouse3CelcatProvider1787851000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "school" SET "assistant" = 'celcat' WHERE "code" = 'univtoulouse3' AND "assistant" IN ('generic', 'univtoulouse3')`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "school" SET "assistant" = 'generic' WHERE "code" = 'univtoulouse3' AND "assistant" = 'celcat'`,
    )
  }
}
