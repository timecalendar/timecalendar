# Phase 09 — On-device data migration

> **Goal:** a one-shot, first-RN-launch importer that recovers existing users' irreplaceable
> on-device data when the RN binary replaces Flutter in place. There is no server backup for
> personal events, checklists, hidden events, or calendar tokens.
>
> **Canonical implementation contract:**
> [`../05-tech-specs/data-migration.md`](../05-tech-specs/data-migration.md)
>
> **Acceptance suite:** [`../04-migration-qa/`](../04-migration-qa/README.md)
> **Historical research:**
> [`../00-exploration/data-persistence-migration.md`](../00-exploration/data-persistence-migration.md)

## Delivery outline

1. Block app readiness on Drizzle schema migrations, environment-reset recovery, and the legacy
   import journal. Tabs, onboarding, changelog, initial sync, and push registration mount only
   after the importer reaches a terminal state.
2. Read `simple_database.db` as bounded, streaming Sembast JSONL and read only the allowlisted
   `flutter.` native preferences through a narrow local Expo module.
3. Import calendars/tokens, personal events, checklist items, hidden events, changelog version,
   theme, notifications enabled, startup tab, and weekend visibility. Imported calendars suppress
   onboarding without fabricating a school selection.
4. Deliberately drop timetable/activity caches, group-colour mode, calendar view type, hour
   height, notification horizon, and every preference outside the allowlist. Server-owned data
   re-syncs after the gate.
5. Apply insert-if-absent/identical/conflict semantics. Existing divergent RN data always wins.
   Recover valid siblings from partially malformed input and report skipped data.
6. Journal `IN_PROGRESS` work across SQLite and MMKV so every process-kill boundary retries
   idempotently. Terminal outcomes are `SETTLED_SUCCESS`, `SETTLED_PARTIAL`, or
   `SETTLED_FAILED` and never rerun automatically.
7. Enqueue one privacy-safe, idempotent first-party report for every terminal result. Upload is
   independent of startup and retries after the app mounts.
8. Keep the Flutter database and preference keys indefinitely. Do not build a reverse bridge or a
   user-facing migration/recovery flow.

## Exit criteria

- The canonical specification's automated fixtures pass, including version transforms,
  last-write-wins/tombstones, malformed and truncated records, collision/no-overwrite cases,
  every crash boundary, resource limits, and offline report-outbox delivery.
- A physical iPhone passes a signed internal TestFlight Flutter→RN update without uninstalling,
  followed by the final production App Store update gate.
- A physical Android device passes a signed Play internal/closed Flutter→RN update without
  uninstalling, followed by the final public Play update gate.
- Android's released preference XML, document path, backup behavior, and in-place survival are
  proven on device; iOS container and preference survival are proven on a physical device.
- Release-mode timing and peak-memory evidence exists on low-end supported hardware.
- Migration reports, privacy controls, dashboards, staged-rollout thresholds, and rollback
  criteria are operational before rollout.

## Risk posture

This remains the highest-risk migration feature because an incorrect import can permanently lose
device-only work. It is built after all target schemas exist, uses no-overwrite writes and an
explicit journal, and is released through staged whole-app cohorts. The operational stop is to
pause store rollout and ship a corrected build; silently disabling the importer is not safe.
