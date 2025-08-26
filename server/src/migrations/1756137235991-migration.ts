import { MigrationInterface, QueryRunner } from "typeorm"

export class Migration1756137235991 implements MigrationInterface {
  name = "Migration1756137235991"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notification_subscription_frequency_enum" AS ENUM('immediately', 'hourly', 'daily')`,
    )
    await queryRunner.query(
      `CREATE TABLE "notification_subscription" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "frequency" "public"."notification_subscription_frequency_enum" NOT NULL DEFAULT 'immediately', "nbDaysAhead" integer NOT NULL DEFAULT '7', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d5c0b2efb91da0d584fddab9542" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "fcm_notification_channel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "notificationSubscriptionId" uuid, CONSTRAINT "UQ_28d3f1aac7ef11d94edafc31f1c" UNIQUE ("token"), CONSTRAINT "REL_60efa1f5dfc628559abec718cd" UNIQUE ("notificationSubscriptionId"), CONSTRAINT "PK_7cbea6e8eb99def5aa18163e896" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "calendar_notification_subscription" ("notificationSubscriptionId" uuid NOT NULL, "calendarId" uuid NOT NULL, CONSTRAINT "PK_fdfa740ec5214385df8022df4d4" PRIMARY KEY ("notificationSubscriptionId", "calendarId"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_419a3c5c1f37deb972e7d741f5" ON "calendar_notification_subscription" ("notificationSubscriptionId") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_fda7ad034028a8f91afe0e8c36" ON "calendar_notification_subscription" ("calendarId") `,
    )
    await queryRunner.query(
      `ALTER TABLE "fcm_notification_channel" ADD CONSTRAINT "FK_60efa1f5dfc628559abec718cdd" FOREIGN KEY ("notificationSubscriptionId") REFERENCES "notification_subscription"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_notification_subscription" ADD CONSTRAINT "FK_419a3c5c1f37deb972e7d741f5d" FOREIGN KEY ("notificationSubscriptionId") REFERENCES "notification_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_notification_subscription" ADD CONSTRAINT "FK_fda7ad034028a8f91afe0e8c362" FOREIGN KEY ("calendarId") REFERENCES "calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "calendar_notification_subscription" DROP CONSTRAINT "FK_fda7ad034028a8f91afe0e8c362"`,
    )
    await queryRunner.query(
      `ALTER TABLE "calendar_notification_subscription" DROP CONSTRAINT "FK_419a3c5c1f37deb972e7d741f5d"`,
    )
    await queryRunner.query(
      `ALTER TABLE "fcm_notification_channel" DROP CONSTRAINT "FK_60efa1f5dfc628559abec718cdd"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fda7ad034028a8f91afe0e8c36"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_419a3c5c1f37deb972e7d741f5"`,
    )
    await queryRunner.query(`DROP TABLE "calendar_notification_subscription"`)
    await queryRunner.query(`DROP TABLE "fcm_notification_channel"`)
    await queryRunner.query(`DROP TABLE "notification_subscription"`)
    await queryRunner.query(
      `DROP TYPE "public"."notification_subscription_frequency_enum"`,
    )
  }
}
