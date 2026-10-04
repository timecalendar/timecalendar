\set ON_ERROR_STOP on

SELECT EXISTS (
  SELECT 1 FROM pg_roles runtime, pg_roles support, pg_namespace namespace
  WHERE runtime.rolname = :'runtime_role'
    AND support.rolname = :'support_role'
    AND namespace.nspname = 'migration_reporting'
    AND runtime.oid <> support.oid
    AND NOT runtime.rolsuper AND NOT support.rolsuper
    AND NOT pg_has_role(runtime.oid, namespace.nspowner, 'MEMBER')
    AND NOT pg_has_role(support.oid, namespace.nspowner, 'MEMBER')
) AS reporting_roles_safe \gset

\if :reporting_roles_safe
BEGIN;
GRANT USAGE ON SCHEMA migration_reporting TO :"runtime_role", :"support_role";
REVOKE ALL ON ALL TABLES IN SCHEMA migration_reporting FROM :"runtime_role", :"support_role";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA migration_reporting FROM :"runtime_role", :"support_role";
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA migration_reporting FROM :"runtime_role", :"support_role";
GRANT EXECUTE ON FUNCTION migration_reporting.accept_report(jsonb) TO :"runtime_role";
GRANT EXECUTE ON FUNCTION migration_reporting.prune_reports(integer, integer) TO :"runtime_role";
GRANT EXECUTE ON FUNCTION migration_reporting.read_report(uuid) TO :"support_role";
COMMIT;
\else
\echo 'Reporting roles must exist, differ, and have neither superuser nor migration-owner membership.'
\quit 1
\endif
