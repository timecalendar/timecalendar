import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateMigrationReporting1791129600000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE SCHEMA migration_reporting;
      REVOKE ALL ON SCHEMA migration_reporting FROM PUBLIC;
      CREATE TABLE migration_reporting.receipt (
        report_id uuid PRIMARY KEY
      );
      CREATE TABLE migration_reporting.report (
        report_id uuid PRIMARY KEY REFERENCES migration_reporting.receipt(report_id),
        payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object' AND octet_length(payload::text) <= 32768),
        received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        last_received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        delivery_count integer NOT NULL DEFAULT 1 CHECK (delivery_count BETWEEN 1 AND 1000000)
      );
      CREATE INDEX report_received_at ON migration_reporting.report(received_at);
      CREATE TABLE migration_reporting.read_audit (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        report_id uuid NOT NULL,
        reader name NOT NULL,
        read_at timestamptz NOT NULL DEFAULT clock_timestamp()
      );
      CREATE INDEX read_audit_read_at ON migration_reporting.read_audit(read_at);
      REVOKE ALL ON ALL TABLES IN SCHEMA migration_reporting FROM PUBLIC;
      REVOKE ALL ON ALL SEQUENCES IN SCHEMA migration_reporting FROM PUBLIC;

      CREATE FUNCTION migration_reporting.accept_report(body jsonb) RETURNS void
      LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
      DECLARE new_id uuid;
      BEGIN
        INSERT INTO migration_reporting.receipt(report_id)
        VALUES ((body->>'reportId')::uuid)
        ON CONFLICT DO NOTHING RETURNING report_id INTO new_id;
        IF new_id IS NOT NULL THEN
          INSERT INTO migration_reporting.report(report_id, payload) VALUES (new_id, body);
        ELSE
          UPDATE migration_reporting.report
          SET last_received_at = clock_timestamp(), delivery_count = LEAST(delivery_count + 1, 1000000)
          WHERE report_id = (body->>'reportId')::uuid;
        END IF;
      END $$;

      CREATE FUNCTION migration_reporting.prune_reports(retention_days integer, batch_size integer)
      RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
      DECLARE removed integer;
      BEGIN
        IF retention_days NOT BETWEEN 1 AND 180 OR batch_size NOT BETWEEN 1 AND 1000
          OR retention_days IS NULL OR batch_size IS NULL THEN
          RAISE EXCEPTION 'Invalid retention configuration';
        END IF;
        DELETE FROM migration_reporting.report WHERE report_id IN (
          SELECT report_id FROM migration_reporting.report
          WHERE received_at < clock_timestamp() - make_interval(days => retention_days)
          ORDER BY received_at LIMIT batch_size FOR UPDATE SKIP LOCKED
        );
        GET DIAGNOSTICS removed = ROW_COUNT;
        DELETE FROM migration_reporting.read_audit WHERE id IN (
          SELECT id FROM migration_reporting.read_audit
          WHERE read_at < clock_timestamp() - make_interval(days => retention_days)
          ORDER BY read_at LIMIT batch_size FOR UPDATE SKIP LOCKED
        );
        RETURN removed;
      END $$;

      CREATE FUNCTION migration_reporting.read_report(requested_id uuid) RETURNS jsonb
      LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
      DECLARE result jsonb;
      BEGIN
        INSERT INTO migration_reporting.read_audit(report_id, reader)
        VALUES (requested_id, COALESCE(NULLIF(current_setting('role'), 'none'), session_user));
        SELECT jsonb_build_object('payload', payload, 'receivedAt', received_at,
          'lastReceivedAt', last_received_at, 'deliveryCount', delivery_count)
        INTO result FROM migration_reporting.report WHERE report_id = requested_id;
        RETURN result;
      END $$;
      REVOKE ALL ON ALL FUNCTIONS IN SCHEMA migration_reporting FROM PUBLIC;
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP FUNCTION migration_reporting.read_report(uuid);
      DROP FUNCTION migration_reporting.prune_reports(integer, integer);
      DROP FUNCTION migration_reporting.accept_report(jsonb);
      DROP TABLE migration_reporting.read_audit;
      DROP TABLE migration_reporting.report;
      DROP TABLE migration_reporting.receipt;
      DROP SCHEMA migration_reporting;
    `)
  }
}
