import { MigrationInterface, QueryRunner } from "typeorm"

export class NotificationsPipeline1786500000000 implements MigrationInterface {
  name = "NotificationsPipeline1786500000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_subscription" ADD "locale" character varying NOT NULL DEFAULT 'fr'`,
    )
    await queryRunner.query(
      `ALTER TABLE "notification_subscription" ADD "timezone" character varying NOT NULL DEFAULT 'Europe/Paris'`,
    )
    await queryRunner.query(
      `CREATE TABLE "subscriber_calendar_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subscriptionId" uuid NOT NULL, "calendarLogId" uuid NOT NULL, "frequency" "public"."notification_subscription_frequency_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_subscriber_calendar_log_subscription_log" UNIQUE ("subscriptionId", "calendarLogId"), CONSTRAINT "PK_subscriber_calendar_log" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriber_calendar_log_frequency_createdAt" ON "subscriber_calendar_log" ("frequency", "createdAt")`,
    )
    await queryRunner.query(
      `ALTER TABLE "subscriber_calendar_log" ADD CONSTRAINT "FK_625cfc20efe57b966d37529e08c" FOREIGN KEY ("subscriptionId") REFERENCES "notification_subscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "subscriber_calendar_log" ADD CONSTRAINT "FK_4fc404d975dfa7b793050a89a18" FOREIGN KEY ("calendarLogId") REFERENCES "calendar_log"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `CREATE TABLE "notify_fanout_cursor" ("id" integer NOT NULL, "cursor" TIMESTAMP NOT NULL, CONSTRAINT "PK_notify_fanout_cursor" PRIMARY KEY ("id"))`,
    )
    // Seed the cursor at migration time: pre-existing calendar_log history must
    // not fan out as a notification storm on the first tick.
    await queryRunner.query(
      `INSERT INTO "notify_fanout_cursor" ("id", "cursor") VALUES (1, now())`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_calendar_log_createdAt" ON "calendar_log" ("createdAt")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_calendar_log_createdAt"`)
    await queryRunner.query(`DROP TABLE "notify_fanout_cursor"`)
    await queryRunner.query(
      `ALTER TABLE "subscriber_calendar_log" DROP CONSTRAINT "FK_4fc404d975dfa7b793050a89a18"`,
    )
    await queryRunner.query(
      `ALTER TABLE "subscriber_calendar_log" DROP CONSTRAINT "FK_625cfc20efe57b966d37529e08c"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscriber_calendar_log_frequency_createdAt"`,
    )
    await queryRunner.query(`DROP TABLE "subscriber_calendar_log"`)
    await queryRunner.query(
      `ALTER TABLE "notification_subscription" DROP COLUMN "timezone"`,
    )
    await queryRunner.query(
      `ALTER TABLE "notification_subscription" DROP COLUMN "locale"`,
    )
  }
}
