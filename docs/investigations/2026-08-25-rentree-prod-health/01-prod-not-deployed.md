# 01 — Production is not deploying `main`

## Symptom

Production continues to run an image built from 2026-06-17 even though relevant server,
queue, notification and school-sync work has landed on `main`. The deployed background
calendar cron is a no-op, so sync occurs only when clients call `/calendars/sync` and the
calendar is older than the 30-minute update gate.

## Evidence

- The production deployment has three API replicas on
  `ghcr.io/timecalendar/timecalendar:main-8df8e201…`; the web uses the matching SHA.
- `git rev-list` reports 39 commits between the deployed SHA and `origin/main`.
- Important missing commits include:
  - `9660060`: per-university minimum sync interval and `syncPlannedAt`;
  - `5993add`: notification delivery pipeline;
  - `27bb0ed`: shared queue module and job-run instrumentation;
  - the Lyon 1 strategy that implements the university's August 2026 request for at most
    one fetch per hour.
- The production `calendar` table has no `syncPlannedAt` column, confirming that the
  corresponding migration has not run.
- At deployed SHA `8df8e201…`, `SyncCalendarsJob.run()` contains only the commented call
  to `syncAllForCronJob()`. At current `main`, `SyncCalendarsFanoutJob` runs every five
  minutes, selects due recently active calendars using `syncPlannedAt`, and queues them.
- `.github/workflows/ci-build-deploy.yml` builds and pushes images on `main` but contains
  no step that updates the platform repository's ArgoCD values. The production tag in
  `kubernetes/clusters/do-fra1-cluster01/20-apps/timecalendar-production/values.yaml`
  was last advanced on 2026-06-17.

## Root cause

The release chain ends after image publication. ArgoCD correctly treats the platform
repository as desired state, but no automation or explicit operating procedure advances
the image tag there after a successful TimeCalendar build. This is release-process drift,
not an ArgoCD reconciliation failure.

The long age went unnoticed because alert delivery is muted and there is no deployment
freshness alert comparing production `service.version` or image SHA with the intended
release.

## Impact

- All production users miss changes merged after 2026-06-17.
- Existing calendars receive no background refresh; updates depend on a user opening the
  app and calling the sync endpoint.
- Queue and notification behavior observed in preproduction cannot be assumed to exist in
  production.
- A direct jump to current `main` combines a schema migration with a large behavior/load
  change. Enabling fan-out without capacity and upstream-rate planning could worsen the
  current restart incident or breach Lyon 1's fetch-rate constraint.

## Potential solutions

1. **Controlled rollout to current `main` with explicit preflight and rollback.** Validate
   the migration, measure the due-calendar backlog by school, cap/sequence fan-out,
   preserve school intervals, canary the image and monitor event-loop delay, queue depth,
   upstream errors and restarts. Highest immediate value, but it is a human-gated deploy
   act and must not be bundled into this report PR.
2. **Make GitOps promotion an owned, auditable release step.** After image/tests succeed,
   open or prepare a platform tag-bump PR with the exact SHA and deployment evidence.
   This retains an approval gate while removing the silent manual gap. Cross-repository
   credentials and workflow permissions require careful design.
3. **Add deployment freshness monitoring.** Alert when production SHA age or distance
   from the intended release exceeds policy. This shortens detection but does not itself
   restore deployments.
4. **Keep production pinned.** Lowest immediate change risk, but leaves background sync,
   fixes and observability improvements absent during the highest-traffic period; not
   recommended.

Follow-up: [TIM-187](/TIM/issues/TIM-187).

