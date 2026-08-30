## Why

[TIM-397](/TIM/issues/TIM-397) built the Activity refresh coordinator — one bounded, single-flight
fetch seam with a five-minute freshness window — and wired **nothing** to it. Today no trigger calls
`refreshNewestPage`, so a student's Activity cache never becomes current: not after a calendar sync,
not when a `calendar_changed` push arrives, not when the app comes back to the foreground.

The reason the wiring is its own ticket is that the wiring is where the capacity risk lives. Activity
was switched off in the first place because one student's request could return a year of unbounded
logs (activity-revival.md:60). Four triggers each issuing their own request rebuilds that risk by a
different route. This change adds the triggers **and** proves that overlapping triggers produce
exactly one request.

## What Changes

- **Add an Activity lifecycle module** — `mobile/src/features/activity/data/lifecycle.ts` — holding
  the three runtime triggers the Activity feature owns: app-foreground refresh, screen-open refresh
  (plus the screen's forced pull-to-refresh), and the removal-driven ownership prune. Every one of
  them routes through Ticket 4's coordinator; none of them issues a request itself.
- **Trigger a forced refresh after a successful calendar sync**, fired non-blocking immediately after
  `replaceAll` commits the events and before the separate name-convergence write. A sync success stays
  a success when the Activity refresh fails — structurally, because `refreshNewestPage` never rejects
  (D3).
- **Trigger a forced refresh independently on a relevant push** — foreground message, background tap,
  and cold-start tap — beside the existing `void sync()` rather than after it, so the push guarantee
  survives a failing sync. Existing calendar tap routing is not touched (D4).
- **Add the five-minute passive policy at the two runtime edges**: background→active foreground
  transitions and Activity screen open. The window itself already lives in the coordinator; this
  change only decides *when* a passive refresh is asked for (D5, D6).
- **Prune Activity history when a calendar is removed** by observing the held-calendar set shrink
  from inside the Activity feature, so the dependency edge points *outward* to calendar-sources
  exactly as architecture decision 6 draws it — never inward from calendar-sources to Activity (D7).
- **Cold launch needs no new code**: the startup calendar sync's post-storage refresh is the cold-launch
  trigger. This change proves that with a test rather than adding a second startup path (D8).
- **NOT changed:** no push payload or server change; no notification-preference change (Activity
  refreshes regardless of subscription prefs); no background fetch; no new app-lifecycle
  infrastructure beyond the Activity runtime; no Activity UI (Ticket 5); no coordinator internals
  (Ticket 4); no `mobile/firebase/`, `app.config.ts`, `eas.json`, native, migration, or generated-client
  change.

## Capabilities

### New Capabilities

- `mobile-activity-triggers` — which events make Activity current, with what force, in which
  direction the trigger edges point, and what a trigger failure may and may not do to its host
  operation.

## Impact

- **Code:** `mobile/src/features/activity/data/` (new `lifecycle.ts`, extended barrels),
  `mobile/src/features/calendar/data/sync/sync.ts`, `mobile/src/features/notifications/data/tap-routing.ts`,
  `mobile/src/app/_layout.tsx`, `mobile/eslint.config.js` (one directional-import guard).
- **Sensitive surfaces:**
  - **Notification / push routing.** `tap-routing.ts` is the deep-link path a student lands on from a
    notification tap. Regressing it is a user-facing break, so every existing routing test stays
    unedited and passing, and the added behavior is asserted beside them (task 6.4).
  - **Cross-feature dependency direction.** Activity must never import calendar internals, and
    `calendar-sources/data` must never import Activity — the latter would close a require cycle
    through `activity/data/request.ts`, which `tsc` does not catch (D7).
  - `mobile/firebase/` and `mobile/app.config.ts` are **not** expected to change; if the Applier finds
    a reason they must, that is a stop-and-raise on [TIM-399](/TIM/issues/TIM-399), per the brief.
- **Depends on unmerged code.** Every symbol this change consumes — `refreshNewestPage`,
  `pruneToHeldCalendars`, `ActivityRefreshOutcome` — exists only on
  [PR #324](https://github.com/timecalendar/timecalendar/pull/324) (TIM-397), which is open and
  currently `CONFLICTING` with `main`. Apply starts after #324 merges and this branch rebases onto it.
- **Doc collision:** #324 also edits `decisions/README.md`, `CHANGELOG.md` and `features.md`. Expect
  conflicts in those three files on rebase, and re-read the live ADR index before choosing a number —
  `045` and `047` are already reserved by other open PRs and #324 takes `048`.
- **QA:** `QA: none`. Real-device push and foreground verification goes to
  `docs/react-native-migration/inbox/` as a `(HUMAN: …)` note and does not block this PR.
