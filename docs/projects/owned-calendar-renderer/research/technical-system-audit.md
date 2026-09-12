# Technical system audit

Date: 2026-09-12. Method: read-only source/configuration inspection and official documentation.
No device reproduction, production query, release profiling, native prototype, or runtime behavior
change was performed. Code observations below are not accepted future behavior or benchmark results.

## Representative current flows

Paths below are relative to the repository root.

| Flow                  | Evidence                                                                                             | Implication for the approved contract                                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar navigation   | `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`                  | In-memory week default, independent anchor/visible state and imperative ref; visible heading changes by month bucket, not one settled snapshot. Mode persistence and agenda active-date feedback need implementation. |
| Range request         | `mobile/src/features/calendar/renderer/calendar-kit/event-window.ts`                                 | Quarter plus two months each side means a seven-month request. This is vendor buffering, not a measured owned-renderer bound.                                                                                         |
| Local read/filter     | `mobile/src/features/calendar/data/events.ts`, `data/sync/hooks.ts`                                  | Full-table synced read plus personal/hidden/source hooks; merge and instant intersection after loading. Cancellation is not filtered here. Error/loading/revision state is not returned by this events hook.          |
| Event decode          | `mobile/src/features/calendar/data/sync/types.ts`                                                    | DTO-to-row fidelity is separate from lossy row projection. `tags.map(tag => tag.name)` is not safe for every malformed JSON array element. Required Date validation is not isolated per row before consumption.       |
| Sync commit           | `mobile/src/features/calendar/data/sync/repository.ts`                                               | Synchronous transaction deletes/replaces with 50-row insert chunks. Preserve this atomic write boundary; UI snapshot atomicity still needs its own proof.                                                             |
| Timeline presentation | `mobile/src/features/calendar/renderer/calendar-kit/calendar-kit-timeline.tsx`                       | Four pages per side, 1/5/7 visible-day selection, vendor event conversion, native ref commands and split callbacks. Own the responsibilities without retaining these incidental constants.                            |
| Screen integration    | `mobile/src/features/calendar/ui/calendar-screen.tsx`                                                | Passes 07:00–21:00 constants and always shows weekends. Sync status and agenda refresh are present. Product requires 24 hours, persisted weekend setting and no Calendar manual refresh.                              |
| Agenda                | `mobile/src/features/calendar/data/agenda.ts`, `ui/agenda-list.tsx`                                  | Start-day grouping only; SectionList has no active-date callback/direct-date protocol. Preserve presentation while correcting coverage/navigation.                                                                    |
| Event details         | `mobile/src/features/calendar/data/event-details.ts`, `ui/event-details-screen.tsx`                  | UID-based rich local read for both sources; read-only/editable behavior belongs here. Revalidate deletion/racing activation and unavailable-state accessibility.                                                      |
| All-day import        | `server/src/modules/fetch/parsers/parse-ical.ts`                                                     | Explicit iCal date input becomes allDay with UTC calendar fields. Missing end can produce zero-day data, which the approved renderer must skip; do not silently alter importer semantics here.                        |
| Runtime               | `mobile/package.json`, installed Reanimated `compatibility.json`                                     | Expo 56 / RN 0.85.3 / Reanimated 4.3.1 / Worklets 0.8.3 pairing is represented in local compatibility metadata. Presence alone does not prove release behavior.                                                       |
| Native window policy  | `mobile/app.config.ts`, `mobile/app.config.test.ts`, `mobile/scripts/assert-ios-device-contract.mjs` | Portrait/full-screen is source-enforced. Landscape/resizing requires source config and test updates plus fresh native fingerprints.                                                                                   |

## Pure utility revalidation — B-009

| Candidate                     | Evidence / required action                                                                                                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data/day-key.ts`             | Uses date-fns-tz wrappers and UTC all-day keys. Reuse only behind strict Gregorian validation and zone/day/DST properties; do not make date-only navigation depend on incidental device timezone.                                                                        |
| `data/time-grid.ts`           | Arithmetic is simple but defaults encode 07:00–21:00, 60 px/hour, 50 gutter and 20 tile width. None of those numbers establishes the owned contract. Height from elapsed duration is not enough for all DST visual projections.                                          |
| `data/overlap-layout.ts`      | Equal-width clustering is useful. Tie sort uses input index and ascending end time despite a comment saying longer-first. Stable identity and input-permutation invariants are required. Column search and per-output cluster search need dense/large-input measurement. |
| `data/agenda.ts`              | Start-day-only grouping cannot satisfy multi-day or date-only coverage; derive sections from shared coverage semantics.                                                                                                                                                  |
| `data/format.ts`              | Reuse localized label helpers only after checking full ranges, missing text, exclusive-end all-day labels and device 12/24-hour preference.                                                                                                                              |
| `data/events.ts`              | Half-open positive-duration intersection is useful, but zero-duration boundary points and all-day date ranges need separate predicates.                                                                                                                                  |
| Renderer event adapter/window | Vendor shapes and quarter/page buffering have no future compatibility promise. Delete at cutover rather than exporting renamed equivalents.                                                                                                                              |

No existing utility is designated trusted by this audit. This closes the inventory portion of
B-009; deterministic revalidation remains required in implementation evidence.

## Workaround inventory — M-011

- Vendor patch: `mobile/patches/@howljs+calendar-kit+2.5.6.patch`; ADR 032 describes live-anchor
  updates and 150 ms repacking throttling. Do not port its timing assumption.
- `GRID_PAGES_PER_SIDE = 4` and quarter plus two-month buffers are existing behavior only.
- The old discovery warning about hard-coded seven-day input needs precision: current adapter
  selects 1/5/7 by props, but the screen passes `showWeekends` unconditionally. There is no
  user-controlled five-day integration yet.
- The 07:00–21:00 range comes from data constants passed by the screen, not a 24-hour requirement.
- The imperative ref, month-bucket heading update and two date callbacks are observable integration
  assumptions, not an API that the owned renderer must preserve.
- Vendor-only import allowance in `mobile/eslint.config.js`, calendar-kit Jest setup and adapter
  coverage paths in `mobile/jest.config.js` belong in the deletion audit. Check remaining users
  before removing patch-package or the unrelated installed pager dependency.

This completes the source inventory, not physical reproduction of the remembered failures P-004.

## Scoped reconciliation inventory — M-012

All paths below are current documentation targets for future implementation reconciliation.
No global record is edited by this planning review.

| Record                                                                      | Displaced portion                                                       | Preserved portion                                                     |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Architecture Book ADR 019                                                   | Calendar-kit selection                                                  | Ownership of pure calendar semantics                                  |
| ADR 020                                                                     | Already superseded by 033; vendor import restrictions become historical | Preserve its historical superseded status                             |
| ADR 032                                                                     | Vendor live-anchor patch, throttling and install gate                   | Historical evidence of why buffering was insufficient                 |
| ADR 033                                                                     | Adapter, current facade shape and 90% pure-code floor                   | Feature-local renderer boundary, screen orchestration ownership       |
| ADR 042                                                                     | Portrait-only/full-screen iPad restriction and matching checks          | iPhone/iPad support, CNG source ownership, fingerprint discipline     |
| `openspec/specs/mobile-calendar-timeline/spec.md`                           | Vendor timeline and incompatible grid/interaction requirements          | Relevant product workflows after reconciliation                       |
| `openspec/specs/mobile-calendar-agenda/spec.md`                             | Start-day coverage or refresh expectations conflicting with product     | Existing agenda presentation                                          |
| `openspec/changes/archive/2026-06-16-add-mobile-calendar-timeline/`         | Calendar-kit implementation is historical                               | Keep archived evidence; link supersession rather than rewrite history |
| Architecture Book `calendar.md`, `testing.md`, `runtime.md`, decision index | Current renderer/runtime gates once implementation changes              | Other features and existing infrastructure rules                      |
| React Native migration Phase 04/10 roadmap and parity checklist             | Calendar-kit completion as a launch-sufficient claim                    | Historical completion of other Calendar core work                     |

ADR 021's stored-row/importer fidelity, ADR 035's effective display timezone, and shared event
identity/checklist ownership remain constraints. If query/index or projection evidence requires
changing those premises, create an additional project-local decision before expanding scope.
M-012's final supersession action remains gated on the approved and implemented architecture.

## Official compatibility evidence

Consulted 2026-09-12:

- [Expo SDK 56 reference](https://docs.expo.dev/versions/v56.0.0/) lists RN 0.85, Android 7+
  and iOS 16.4+. This matches the proposed baseline; it is not an on-device compatibility pass.
- [Reanimated compatibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/)
  lists RN 0.85 and Worklets 0.8 for the 4.3 series and requires New Architecture. The installed
  package's compatibility metadata provides local corroboration for the selected versions.
- [Expo New Architecture](https://docs.expo.dev/guides/new-architecture/) supplies runtime context.
- [Expo Reanimated](https://docs.expo.dev/versions/v56.0.0/sdk/reanimated/) and
  [Gesture Handler](https://docs.expo.dev/versions/v56.0.0/sdk/gesture-handler/) document integration.
- [React Native 0.85 accessibility](https://reactnative.dev/docs/0.85/accessibility) provides native
  semantic API reference. It cannot substitute for the product's recorded human passes.

## Evidence limits

The production aggregate query remains unavailable in the historical evidence: exec/portforward
were denied and direct connection timed out. This session did not retry access, request credentials,
extract data or contact an operator. Do not claim p50/p95/p99 or client source-count distributions.
No comparison prototype or physical-device result exists in this session. The next research plan
specifies what can disprove the candidate instead of attaching invented benchmark scores.
