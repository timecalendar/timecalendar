## 1. Batched checklist-progress data seam

- [ ] 1.1 Add the minimal `@/db` operator exports needed for a UID-set select and always-false empty-set predicate, then implement `ChecklistProgress` plus the normalized, deduplicated `useChecklistProgress(eventUids)` read under `mobile/src/features/event-checklists/data/`; verify the query selects only `eventUid`/`isChecked`, uses one `useLiveQuery`, and applies no `deletedAt` predicate.
- [ ] 1.2 Add focused data tests for empty and duplicate UID sets, one set-oriented query shape, synced/personal-style UID equivalence, zero/partial/complete aggregation, and an imported non-null-`deletedAt` row; run the new data suite directly.
- [ ] 1.3 Add a reactive hook/fake-DB test that keeps one consumer mounted across add, check, uncheck, reorder, and hard-delete notifications; assert totals/completed update and reorder preserves both counts, then run that suite directly.

## 2. Shared visual and accessibility contract

- [ ] 2.1 Add a feature-owned `ChecklistProgressIndicator` with inline and compact variants: omit zero totals, show `completed/total`, distinguish all-complete with an explicit checked glyph/shape plus styling, clamp dense output, and hide the visual primitive from the accessibility tree so the owning summary announces it once.
- [ ] 2.2 Add EN/FR parity keys for the localized completed-of-total phrase and any indicator semantics; add focused indicator tests for zero, partial, complete, inline, compact, light/dark theme tokens, and constrained geometry, then run the suite directly.

## 3. Home summary surfaces

- [ ] 3.1 Subscribe once at the Home screen/controller boundary for the unique `todayEvents` UID set and thread the sidecar progress map through `UpcomingSection`/`UpcomingScroller`, `TodaySection` all-day cards, and `TodayTimeline` without changing event-source behavior.
- [ ] 3.2 Render progress and compose its localized phrase into the existing event label on upcoming cards, all-day cards, normal timed tiles, and Dynamic Type reflow rows; preserve zero hiding and the existing synced/personal routing hints.
- [ ] 3.3 Extend Home component tests with synced and personal events covering zero, partial, complete, upcoming, all-day, normal timed, and forced Dynamic Type reflow layouts; assert visible counts and the complete accessible labels, then run only the affected Home suites.

## 4. Calendar day/week renderer and Agenda

- [ ] 4.1 Subscribe once in `CalendarScreen` for the rendered range's unique event UIDs and pass progress beside `CalendarEvent[]` through `AgendaList` and the renderer-neutral `CalendarTimelineProps`; do not add data hooks inside tiles or Agenda rows.
- [ ] 4.2 Thread the sidecar progress map through `CalendarKitTimeline` into timed and all-day tile renderers while keeping `eventItems = useMemo(..., [events])`; render the compact indicator and compose the localized phrase into both tile labels.
- [ ] 4.3 Render inline progress on Agenda rows and compose the localized phrase into the existing button label while preserving zero-item rows and the upcoming marker semantics.
- [ ] 4.4 Add renderer tests for day/week timed and all-day tiles, synced and personal UIDs, partial/complete/zero states, dense overlaps and minimum widths, plus a progress-only rerender assertion that the CalendarKit vendor event array/projected objects retain identity; run the focused renderer suites.
- [ ] 4.5 Extend Agenda component coverage for synced/personal zero, partial, complete, reactive-map updates, and accessible labels; run the Agenda suite directly.

## 5. Real journey, documentation, and device-only evidence

- [ ] 5.1 Extend `mobile/.maestro/event-checklists.yaml` without removing or weakening its real add/toggle/delete assertions: after creating and toggling the seeded event's item, return through the existing screen stack and assert the event summary exposes all-complete `1/1`, then retain cleanup; validate the YAML/static selector contract locally.
- [ ] 5.2 Update `docs/mobile/architecture-book/features.md`, `calendar.md`, `storage.md`, and `testing.md` with the current checklist-progress read/render/test contracts. If implementation changes an Architecture Book rule, stop and add the required ADR plus `CHANGELOG.md` entry before continuing; otherwise do not create an ADR or chronology entry.
- [ ] 5.3 Add a non-blocking `docs/react-native-migration/inbox/` note tagged `(HUMAN: ...)` for physical-device light/dark, Dynamic Type, VoiceOver/TalkBack, dense-week, smallest-tile, and live-return observations. Do not add the normally-unused `run-e2e` PR label and do not treat this host's lack of KVM as a blocker.

## 6. Compatibility and completion proof

- [ ] 6.1 Check whether TIM-268 PR #293 has landed before final verification; if it has, rebase the feature branch and rerun the focused checklist suites. Keep this change out of `mobile/src/features/event-checklists/ui/event-checklist.tsx` unless a proven incompatibility is returned to the Founding Engineer.
- [ ] 6.2 Run Prettier/check formatting on changed files, then the smallest focused Jest suites, `npx tsc --noEmit`, `npm run lint`, and the normal coverage command in `mobile/`; record exact commands and results in the handoff.
- [ ] 6.3 Push the exact implementation head and require the normal `ci-mobile` `test-mobile` job (generated-client drift, TypeScript, lint, Jest coverage) to pass as the CI proof. Confirm no OpenAPI/generated client, migration, native/store/EAS/Firebase, workflow/deploy, or legacy `app/` diff was introduced.
