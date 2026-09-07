## 1. Lock responsive test seams and ownership

- [x] 1.1 Extend the existing Settings, notification, hidden-events, Activity, About, changelog, feedback, splash, dev-import, and route-structure test harnesses only as needed to dispatch owner `onLayout` measurements and inspect flattened lane styles; verify the pre-change focused suites still pass before production edits.
- [x] 1.2 Add representative failing assertions for compact phone layout at 390, the 599/600 gutter transition, centered/capped 768/800/834/1024 tablet content, and one-column composition; verify they fail because the current local `MaxContentWidth`/fixed-gutter owners do not consume the shared lanes, not because a behavioral mock changed.
- [x] 1.3 Record and enforce the ownership boundary in the change: do not edit `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx`, rename content, or shared responsive/theme primitives; verify the Settings calendar-summary row still targets `/user-calendars` through the existing integration test.

## 2. Adapt Settings and notification surfaces

- [x] 2.1 Move the Settings hub's summary and complete grouped sections into one measured standard lane inside the existing left/right safe-area and ScrollView owners; remove the replaced local fixed cap/gutter, keep every whole section in one source-ordered column, and verify section edges at 390/768/800/834/1024.
- [x] 2.2 Preserve Settings summary loading/empty/count text, Activity badge, conditional environment section, row order, full-row routing, testIDs, and large-text accessibility while adapting width; rerun the focused Settings hub suite and assert these behaviors alongside the responsive layout.
- [x] 2.3 Move appearance and timezone controls into measured readable lanes inside their existing SafeAreaViews; preserve titles/header configuration, native Host/Picker anchors, option order, selected values, and immediate preference setters, then verify focused suites at phone and tablet widths.
- [x] 2.4 Move notification controls plus failure/retry content into one measured readable lane; preserve native Picker/Switch behavior, stepper limits and touch targets, immediate persistence/registration, error recovery, labels, and testIDs, then verify preference, loading/error/destructive states at representative widths.

## 3. Adapt hidden-event management and Activity

- [x] 3.1 Apply the measured standard lane to hidden-event loaded, empty, and write-error content without adding a second vertical scroll owner; preserve named-before-UID order, time-zone formatting, one-column rows, un-hide actions, and accessibility announcements, then verify focused states at 390/768/800/834/1024.
- [x] 3.2 Apply `useAdaptiveLayout("standard")` at Activity's existing SectionList/safe-area owner so loaded rows, group headers, cached errors, empty content, loading/full errors, and older-page footer align to one measured lane without nesting the virtualized list; remove the competing local cap/fixed gutter.
- [x] 3.3 Rerun and extend the Activity suite to cover dense and paged groups, loading, empty, cached/full errors, refresh state, older-loading/error, and measured phone/tablet layout while preserving `RefreshControl`, `onEndReached`, footer retry, group order, row navigation, cancelled-row inertness, unread clearing, testIDs, and accessibility order.
- [x] 3.4 Review the Activity production diff for data-layer drift and verify no cache merge, read-watermark, five-minute freshness, token precondition, single-flight, cursor, page-size, or repository behavior changed.

## 4. Adapt informational and feedback content

- [x] 4.1 Put About's grouped SettingsSection content in a measured standard lane and its blurb/link-error copy inside readable inner bounds without adding columns; preserve metadata fallbacks, privacy/contact/developer/changelog actions, link-failure recovery, source/focus order, safe-area edges, and long-text behavior, then verify the focused suite at phone/tablet widths.
- [x] 4.2 Make `ChangelogContent` resolve one readable lane from its actual presented owner so history releases, sheet releases, and optional footer share the same cap; preserve release order, item rows, safe-area behavior, close/continue actions, and acknowledgement lifecycle, then verify several releases and long notes at representative widths.
- [x] 4.3 Extend static route/presentation coverage to prove `/changelog` retains its regular visible-header route and `/changelog-sheet` retains the existing iOS form-sheet and Android full-screen-modal branches; do not alter the route options to obtain responsive behavior.
- [x] 4.4 Put Feedback's intro, fields, validation errors, submit action, and pending/failure status in one measured readable lane inside the existing KeyboardAvoidingView, SafeAreaView, and ScrollView hierarchy; preserve parameter bounds, remembered e-mail, validation, request single-flight, success alert/back behavior, touch targets, and testIDs.
- [x] 4.5 Rerun and extend Feedback tests for empty, prefilled, invalid, pending, failure, and success cases at 390/768/800/1024, asserting both readable-lane resolution and unchanged keyboard/navigation/submission behavior.

## 5. Verify explicit no-change surfaces

- [x] 5.1 Add responsive regression cases to the Splash suite at representative phone/tablet widths and reduced-motion branches; verify the full-window absolute overlay stays centered/non-stretched and native handoff, readiness, fade, accessible progress, and reduced-motion cleanup remain unchanged without changing production composition unless a real defect is exposed.
- [x] 5.2 Add responsive regression cases to dev import for production-inert, development loading, failure, and successful replace behavior; verify centered non-stretched status, headerlessness, runtime gate, one-shot import, accessible state, and `/calendar` replacement remain unchanged, reusing a readable lane only if it introduces no behavior churn.
- [x] 5.3 Extend the static route test to prove `/profile` and `/more` remain one-line renderless redirects to `/settings` at every width and that no responsive wrapper or new route UI is introduced.

## 6. Update current-state documentation

- [x] 6.1 Update `docs/mobile/tablet-quick-wins.md` rows for every TIM-502-owned screen with the implemented lane/disposition and focused verification outcome; keep user calendars marked as TIM-501-owned integration-only and record Splash, dev import, `/profile`, and `/more` as verified no-change surfaces.
- [x] 6.2 Update `docs/mobile/architecture-book/theming.md` with concise current-state guidance for how settings, virtualized history/management lists, readable forms/prose, and presented changelog content consume the existing responsive primitives, then append the matching dated entry to `docs/mobile/architecture-book/CHANGELOG.md`.
- [x] 6.3 Verify no new ADR is needed because this change consumes ADR 042 and the established responsive policy without changing a load-bearing rule; if implementation requires a new primitive, native presentation rule, data semantic, or cross-ticket ownership change, stop and return the design mismatch before documenting it as current state.

## 7. Local-green, CI proof, and handoff checks

- [x] 7.1 Run focused Jest for every changed component/static suite from `mobile/` with natural exits; verify responsive tests exercise actual owner layout events and preserved user behavior rather than duplicating `resolveResponsiveLayout` internals or relying on snapshots alone.
- [x] 7.2 Run `npx tsc --noEmit`, `npm run lint`, and the full mobile Jest coverage command used by CI; fix type, typed-i18n, accessibility, formatting, coverage, and randomized-order lifecycle failures without increasing timeouts, adding retries, or weakening matchers.
- [x] 7.3 Treat the focused responsive suites plus existing route/selector guards as the CI proof: demonstrate they fail if semantic lane mappings regress, a second safe-area/gutter owner appears, Activity becomes nested/non-virtualized, changelog presentation changes, a transient surface stretches, or a compatibility redirect renders content.
- [x] 7.4 Run `git diff --check`, inspect the complete branch diff, and verify no changes to API/generated code, migrations, shared responsive/theme primitives, TIM-501-owned calendar-management UI, dependencies, native/store/EAS/Firebase configuration, deployment/CI workflows, secrets paths, or legacy Flutter; confirm existing affected Maestro selectors still resolve.
- [x] 7.5 Immediately before final review/merge, update from latest `main`, resolve concurrent TIM-501 and sibling tablet work without taking over their files, rerun all affected focused tests plus mobile local-green checks, and record only actual CI/device outcomes; no screenshot, physical-device, human approval, or separate QA gate applies.
- [ ] 7.6 Push the implementation and verify the normal mobile CI checks at the exact branch head; fix TypeScript, lint, Jest/coverage, generated-client drift, commit-identity, and disclosure failures before review handoff, reporting path-gated native jobs as skipped unless they actually ran.
