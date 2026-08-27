## Why

At rentrée, 2,892 calendars used in the previous seven days still carry an explicit
export window ending in the past, so students can silently see last year's events while
failed or empty refreshes preserve that snapshot. AMU is the largest concrete transition:
1,316 of 1,448 recently active AMU calendars point at the retired 2025–26 source, while
the university now publishes 2026–27 schedules through a different service.

## What Changes

- Add a server-owned, non-destructive source-health classifier that combines strong
  evidence: an expired explicit export window, the last recorded successful content
  change, and a small reviewed registry of known school/source transitions.
- Extend each calendar returned by batch sync with a typed, URL-free source-health and
  recovery contract. The contract distinguishes `healthy`, `unknown`, and `stale`, uses
  stable reason/action codes, and never returns the feed URL or embeds it in diagnostics.
- Treat AMU's retired-host/academic-year transition as an explicit stale rule with a
  guided re-add action. Do not rewrite stored URLs, delete calendars, or replace their
  cached events.
- Persist the latest server-derived health snapshot through the mobile storage seam and
  surface it both in Calendar and in calendar-source management. Recovery routes through
  the existing add-calendar flow; the old source remains until the user deliberately
  removes it after a successful re-add.
- Keep the dev-only seeded import orchestration alive across the synchronous rerender caused
  by that health-snapshot write, so one successful add + real sync performs exactly one
  navigation to Calendar while the screen remains mounted. Prove the regression with the
  real sync hook and a mounted reactive source-health subscriber.
- Add server classifier/contract tests, mobile data/UI/i18n/accessibility tests, and a
  labelled Maestro recovery flow for CI. Drive the current native Calendar view menu through
  `calendar-view` then its `Agenda` action in the seeded calendar flow and any inherited flow
  using the removed agenda-item id, while retaining the real seeded event/details assertions.
  Record simulator/device-only visual and accessibility checks as a `(HUMAN: …)` migration
  inbox note.
- Stabilize both Settings child-route returns in the shared Maestro flow by activating the
  visible native iOS `BackButton` and retaining Android's supported system-back interaction.
  Keep the existing Settings, My calendars, Appearance & language, and section assertions;
  do not replace them with timeouts, optional navigation, or product-route changes.
- Match the retained stale-source event through the cross-platform grouped accessibility
  label shape already used by other agenda assertions. Keep the title proof required, retain
  its 60-second synchronization bound, and preserve every downstream recovery assertion and
  action.
- Match the immediately following Review control through a required label-containing
  selector on both platforms because iOS groups its visible title and guidance into one
  accessibility label. Keep the existing 60-second wait and all later recovery gates.
- Match the required re-add control through a label-containing selector that accepts the
  visible Android title and iOS's calendar-specific accessibility label. Keep the action
  mandatory and preserve the final school-selection destination gate.
- Keep bulk rewriting, backfill, production rollout, and changes to legacy Flutter out of
  this merge. Any later migration/backfill is a separate human-gated rollout ticket.

## Capabilities

### New Capabilities

- `calendar-source-health`: Server-side stale-source classification and the safe recovery
  metadata exposed by the calendar sync contract, including the AMU transition.

### Modified Capabilities

- `mobile-calendar-sync`: A successful sync also refreshes the rebuildable source-health
  snapshot while preserving last-good event rows for stale or failing sources.
- `mobile-calendar-import-token`: The dev-only import completes exactly once across reactive
  source-health rerenders and navigates only while its screen remains mounted.
- `mobile-e2e`: Seeded calendar flows select Agenda through the live native view menu and
  continue to prove the unmocked server → client → SQLite round-trip on both platforms;
  the Settings flow uses each platform's supported return interaction for both child routes;
  stale recovery matches the retained event, Review control, and re-add control inside their
  grouped iOS accessibility labels without weakening Android or later recovery gates.
- `mobile-user-calendars`: Calendar management identifies stale sources and offers a
  non-destructive, accessible re-add path.

## Impact

- Server calendar sync/helper/repository code and school-source strategy metadata; no new
  server table, migration, dependency, or production backfill.
- Sensitive contract surfaces: `openapi/openapi.json` and generated
  `mobile/src/api/generated/` output (generated, never hand-edited).
- Mobile calendar sync data/store seam, Calendar status UI, calendar-source management UI,
  dev-import orchestration/integration tests, typed French/English translations, and
  existing Maestro flows. The Settings-return remediation is limited to
  `mobile/.maestro/settings.yaml`, and the grouped-label remediations are limited to selectors
  in `mobile/.maestro/stale-source-recovery.yaml`; neither changes product navigation, the API
  contract, schema, native configuration, or binding Architecture Book rules.
- `docs/mobile/architecture-book/calendar.md` changes because sync now carries reusable
  source-health/recovery semantics. The classifier registry is application policy, not a
  destructive migration mechanism.
- No changes to `server/src/migrations/`, `mobile/app.config.ts`, `mobile/eas.json`,
  `mobile/firebase/`, infrastructure/workflows, or `app/` legacy Flutter are planned.
