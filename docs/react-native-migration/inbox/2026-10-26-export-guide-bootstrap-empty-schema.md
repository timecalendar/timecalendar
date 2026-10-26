**For:** the owner of the server export-guide module. No human action is needed.

# Export-guide bootstrap silently stays empty when the server boots before migrations

`ExportGuideBootstrapService.onApplicationBootstrap`
(`server/src/modules/export-guide/services/export-guide-bootstrap.service.ts`) publishes the
initial catalogue only when the `school` table exists. On Postgres `42P01` it returns without a
retry or a log line. `ExportGuideCatalogueStore` loads its snapshot once, so a server that boots
on an unmigrated database keeps an empty catalogue for its whole lifetime, and every
`GET /schools`, `GET /schools/:id` and `POST /schools/search` fails with
`Export-guide snapshot unavailable` (500) until the process restarts.

This is what kept the mobile nightly Maestro lane red from 2026-09-13 to 2026-10-26 (Android run
40077031966: three `Export-guide snapshot unavailable` errors in the server log, app on "Could not
load schools"). `fix-e2e-server-seed-order` fixed the e2e harness by seeding before boot; the
server behaviour is unchanged.

Any other boot-before-migrate path hits the same trap: a local `npm run start` before
`db:init`, or a deployment whose migrations run after the new pod starts. Candidates: log a
warning and retry the initial publish on the first request that needs the snapshot, or fail
`/health` while no catalogue is active so orchestration restarts the pod. Neither is decided.
