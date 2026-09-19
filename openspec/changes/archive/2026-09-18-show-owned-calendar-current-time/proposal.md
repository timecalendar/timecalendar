## Why

The owned Day/Week timeline now renders a complete, zoomable, resizable 00:00–24:00 surface, but it always opens at the top of the day and never shows where the student is in it. A fresh Calendar open lands on 00:00 and the only Today signal is the dated header cue, which is recomputed from a fresh `new Date()` on every render. There is no current-time indicator, no clock that rolls the Today meaning over at midnight, and no foreground refresh — so Today and "now" can disagree, and the visible hours are almost never the useful ones.

## What Changes

- Own one injected, focus- and foreground-aware minute clock in the Calendar controller/data seam, and drive the existing Today header cue, the Today action, and the new current-time indicator from that single value instead of ad hoc `new Date()` reads.
- Position a freshly mounted timeline so the current display-zone minute sits near 30% of the measured, inset-aware timed viewport, clamped to explicit 00:00–24:00 raw bounds; an already mounted viewport is never re-positioned by a clock tick, a foreground return, or a geometry revision.
- Render a current-time indicator on the column whose display-zone date is today, with a non-color shape cue plus a typographic gutter time label, tracking live pinch scale on the UI thread without per-frame React state.
- Update at displayed (minute) precision only while Calendar is focused and the app is foreground; stop recurring work on blur, background, and unmount; recompute clock meaning — not scroll position — on foreground and day rollover.
- Pass explicit `FULL_DAY_START_MINUTE`/`FULL_DAY_END_MINUTE` bounds and the settled dynamic scale to `nowIndicatorPosition` while leaving its shared 07:00–21:00 defaults untouched for Home and Agenda.
- Replace the repository contract's blanket renderer timer text ban with scoped, positive lifecycle assertions: the displayed-precision timer exists only in the named clock module, is minute-aligned, is cleared on every exit path, and no continuous idle animation loop appears anywhere in the calendar feature.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: a fresh Day/Week timeline opens around the current display-zone time and shows a non-color current-time indicator driven by one lifecycle-scoped clock shared with the Today cue.
- `mobile-architecture-book`: current-state Calendar guidance must describe the single controller-owned clock, the fresh-open positioning rule, the timer-free renderer, and the host/device evidence boundary instead of stating that the shell has no now indicator.

## Impact

- Affects `mobile/src/features/calendar/data/time-grid.ts` (new pure initial-offset helper), a new `mobile/src/features/calendar/data/clock.ts`, the calendar data barrel, `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`, `mobile/src/features/calendar/ui/calendar-screen.tsx`, the owned renderer shell/coordinator/canvas/header, EN/FR locale keys, focused suites, `mobile/calendar-owned-shell.contract.test.ts`, and current Architecture Book Calendar/testing pages plus `CHANGELOG.md`.
- Touches no sensitive surface: no OpenAPI spec or generated client, no server migration, no `app.config.ts`/`eas.json`/`firebase/` native or store config, no `terraform/`, `k8s/`, or `.github/workflows/`, no legacy Flutter app, and no stored event facts.
- Adds no dependency, no second or compatibility renderer, no continuous animation loop, and no production clock override: deterministic morning/late-night/rollover scenarios are host fixtures, and the owner's device build is a normal real-clock build.
- Adds no new binding Architecture Book rule that displaces an indexed decision, so no ADR is required; current-state pages and the Book changelog carry the update.
