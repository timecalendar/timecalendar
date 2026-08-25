## Why

Production is pinned to an image from 2026-06-17 while current `main` introduces a
database migration and activates five-minute calendar-sync fan-out. Promoting that gap
without immutable-image proof, a measured migration and fan-out envelope, and explicit
go/no-go and rollback gates could overload TimeCalendar or university ADE servers during
rentrée.

## What Changes

- Add a checked-in TimeCalendar release runbook that traces a merge on `main` through the
  immutable `main-<40-character-sha>` server and web images, preproduction consumption,
  soak evidence, production observation windows, abort criteria, and rollback commands.
- Make the pending `syncPlannedAt` migration's one-time backfill conservative for the
  first post-migration wave, then prove its `up` and `down` behavior against
  representative PostgreSQL data while recording runtime and lock evidence.
- Add a repeatable, read-only capacity worksheet and queries for initial backlog,
  steady-state five-minute fan-out, 14-day active-calendar cutoff, effective worker
  concurrency, queue depth/age, upstream attempt amplification, and ADE request rate.
- Add a committed CI proof that Lyon 1 calendars cannot become due less than one hour
  after their last fetch during migration or normal runtime.
- Record any credentialed preproduction/production evidence collection in a tagged human
  inbox note. The change prepares promotion evidence; it does not flip the production tag.

## Capabilities

### New Capabilities

- `timecalendar-release-operations`: Defines the immutable-image provenance,
  migration/load evidence, preproduction soak, go/no-go, observation, abort, and rollback
  contract for a TimeCalendar server/web promotion.

### Modified Capabilities

- `server-calendar-sync-policy`: Requires the `syncPlannedAt` migration and the first
  post-migration fan-out to preserve Lyon 1's one-upstream-fetch-per-calendar-per-hour
  limit.

## Impact

- **Server schema/tests:** `server/src/migrations/1787641039755-AddCalendarSyncPlannedAt.ts`
  and a targeted migration integration proof. The migration is a sensitive surface and
  requires human review.
- **Operations docs:** a TimeCalendar-owned release runbook plus a
  `docs/react-native-migration/inbox/` evidence checklist for credentialed environment
  access.
- **External systems read by operators:** GitHub Actions/GHCR, the read-only
  `lyrolab/platform` preproduction and production desired state, Argo CD/Kubernetes,
  PostgreSQL, Redis/BullMQ, and the observability stack. No platform-repository edit is
  included.
- **Contract/dependencies:** no controller or DTO change, no OpenAPI/generated-client
  change, and no new runtime dependency.
- **Sensitive surfaces not changed:** `.github/workflows/`, `terraform/`, `k8s/`, native
  or store configuration, secrets/certificates, and legacy `app/`. If implementation
  evidence shows a workflow or platform change is required, the Applier must stop and
  escalate rather than expand this change.
