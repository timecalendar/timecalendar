-- The `postgres` role (trust auth in docker-compose) is a superuser, so it has
-- CREATEDB — required because the Jest suite no longer shares one static test
-- database. Each worker creates/drops its own `timecalendar_test_${WORKER_ID}`
-- at runtime via nest-shared's setupTestDatabase() (see setup-tests.ts), which
-- is what lets the suite run in parallel.
--
-- `timecalendar`      — runtime/dev database.
-- `timecalendar_test` — retained as: (a) the base the worker setup connects to
--   in order to issue CREATE DATABASE for each worker DB, and (b) the migrated +
--   seeded database the E2E server boots against (docker-compose.e2e.yml /
--   ci/e2e-server.sh). It is no longer a shared Jest target.
CREATE DATABASE timecalendar;
CREATE DATABASE timecalendar_test;
