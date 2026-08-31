# Tasks — first-launch onboarding and first-iCal reminder

## 1. Typed first-launch policy and persistence

- [x] 1.1 Create `mobile/src/features/first-launch/{data,store,ui}/` with sublayer and feature barrels; add the pure initial-route/reminder decision functions from design Decisions 3 and 7. Verify with table-driven unit tests for unresolved, fresh/empty, skipped/empty, dismissed-reminder/empty, imported, and one-or-more-calendar inputs.
- [x] 1.2 Add separate total-decoded stores for `OnboardingResolution` and `FirstIcalReminderState` using only `@/storage`, including imperative writes and reactive hooks. Verify valid round-trips, malformed/missing fallbacks, independent writes, and reactive relaunch simulations in focused Jest tests.
- [x] 1.3 Add both flat keys to `STORAGE_KEYS` and classify them `environment-independent`; extend the exhaustive classification/reset tests to prove backend-bound clearing preserves both decisions.
- [x] 1.4 Add and publicly export one calendar-sources `useUserCalendarsState()` hook whose `{ calendars, loaded }` fields derive from a single `useLiveQuery` result; verify the loaded/data snapshot cannot race while preserving existing hook behavior.

## 2. Awaited startup and route eligibility

- [x] 2.1 Change `runMigrations()` to record and rethrow failures, then rework `useAppReady()` into the ordered migration → typed no-op Phase 09 importer prerequisite coordinator with pending/failed/retry state. Verify call ordering, success, rejection, Retry, and watchdog-to-recovery (never watchdog-to-ready) with fake timers.
- [x] 2.2 Refactor `mobile/src/app/_layout.tsx` so database readers and runtime side effects mount only inside a post-prerequisite component; keep the JS splash/recovery continuation mounted while prerequisites or the first calendar read are unresolved. Verify a pending migration/importer creates no calendar read, startup sync, Activity, notification runtime, or navigation child.
- [x] 2.3 Drive the root route graph from the pure decision and `Stack.Protected`: onboarding plus the existing development token-import route remain available, while `(tabs)` and every other post-onboarding sibling share the eligibility guard. Verify fresh launch falls back to onboarding without mounting Home/Calendar, eligible routes retain the existing deep-link/back-stack anchor, and no root route is accidentally left outside the intended guard.
- [x] 2.4 When the first loaded calendar set is non-empty and resolution is absent, seed `calendarImported` without delaying eligibility. Verify a recovered Phase 09-shaped token prevents onboarding and later transition to zero calendars does not reopen it.

## 3. Shared confirmation, Skip, and import success

- [x] 3.1 Build one controlled import-later confirmation `Modal` in `first-launch/ui` with shared title/body/confirm copy, caller-specific cancel text, `accessibilityViewIsModal`, heading focus on show, platform back/backdrop cancellation, no animation, Dynamic Type-safe layout, and 44pt/48dp controls. Verify focus/semantics and every cancel/confirm edge in its component test.
- [x] 3.2 Rewire welcome-screen Skip on pages 1–2 to open the shared confirmation; cancel stays on the current carousel page, while confirm persists only `skipped` and lets the root inverse guard select the tabs anchor. Update the welcome test to prove school selection is not pushed by Skip, reminder state is untouched, and the final CTA still opens `/onboarding/school`.
- [x] 3.3 Extend the existing shared `leaveImportJourney()` success seam so QR and iCal URL success records `calendarImported` after durable upsert and before clearing/leaving; make the single-entry deep-link fallback replace deterministically to `/calendar`. Verify QR, URL, failed-import, normal-stack, and direct-entry branches without duplicating completion writes in the screens.

## 4. Shared first-iCal reminder on both tabs

- [x] 4.1 Implement the shared `FirstIcalReminder` from the public calendar-sources read plus reminder store: unresolved reads render nothing, zero/pending renders, positive calendar count hides reactively, and a later zero count respects dismissal only. Cover the full visibility matrix and hide-after-import behavior in focused tests.
- [x] 4.2 Compose the same reminder as the bottom normal-flow child of Home and Calendar, with its own bottom `SafeAreaView`, rounded tokenized surface, wrapping/scaling copy, import CTA, and dismiss affordance; ensure both flexible content regions and Android FABs remain unobscured. Verify both host screens render the shared component and a small-screen/large-text case does not clip controls.
- [x] 4.3 Route the reminder CTA to the existing `/onboarding/school` journey. Route dismissal through the shared confirmation: cancel/dismiss writes nothing and keeps the card; confirm persists only `dismissed` and hides it immediately. Verify CTA, cancel, confirm, resolution independence, and relaunch durability.

## 5. Localization, accessibility, and focused regression proof

- [x] 5.1 Add typed English and French keys for startup recovery, shared dialog, contextual cancel labels, reminder heading/body/actions, labels, and hints; update any changed onboarding copy and verify bidirectional catalog parity with `npx tsc --noEmit` plus the no-literal lint rule.
- [x] 5.2 Expand root/splash/first-launch/onboarding/import/Home/Calendar tests to cover the acceptance matrix: no-tabs mount, prerequisite failure/retry, skip cancel/confirm, personal-event route at zero calendars, reminder on both tabs, CTA routing, dismissal durability, successful-import resolution, and deletion-to-zero behavior. Run the focused suites and confirm all `first-launch/{data,store}` logic remains above the 90% line/branch gate.
- [x] 5.3 Audit new controls for translated roles/labels/hints, modal focus order, decorative exclusions, 44pt iOS/48dp Android targets, font scaling, reduced motion, safe areas, contrast, and small screens. Record irreducibly on-device VoiceOver/TalkBack/Dynamic Type checks in `docs/react-native-migration/inbox/` tagged `(HUMAN: …)` without making them a repository-merge blocker.

## 6. Native fresh-install proof

- [x] 6.1 Replace/update the fresh-install Maestro flow so `launchApp: clearState: true` with no deep link first sees onboarding, confirms Skip, creates and observes a personal event with zero calendars, and sees the first-iCal reminder on Home and Calendar using stable cross-platform selectors.
- [x] 6.2 Add one nested reusable Maestro setup that resolves first launch by confirming Skip, then apply it to every existing zero-calendar flow whose `clearState`/direct deep link would now be protected (including Settings, environment switch, user calendars, About, Feedback, and personal-events paths as applicable). Preserve the welcome → school/import-success and seeded dev-import/calendar flows, and run committed Maestro/static selector tests to prove no stale selector or accidental top-level helper is introduced.
- [ ] 6.3 Apply the PR's `run-e2e` label after implementation is pushed and obtain green Android and iOS `ci-mobile-e2e` jobs on the exact review head. Treat absent/red native evidence as Applier rework; do not create a separate QA or human gate.

## 7. Architecture Book and roadmap

- [x] 7.1 Add ADR 054 (053 was reserved by open PR #336 at the required recheck) for ordered startup prerequisites plus `Stack.Protected` first-launch eligibility, including the dev-import exception and revisit conditions; update the decisions index after rechecking open-PR reservations.
- [x] 7.2 Update `docs/mobile/architecture-book/navigation.md` (protected first-launch graph/no-paint rule), `storage.md` (awaited migration and independent environment-independent flags), and `CHANGELOG.md`; ensure source, tests, and binding prose agree.
- [x] 7.3 Amend `docs/react-native-migration/01-roadmap/03-onboarding-and-sources.md` from optional/reachable onboarding to the skippable first-launch gate plus durable reminder, and record Phase 09 only as an ordered prerequisite seam.

## 8. Local-green and CI proof

- [x] 8.1 From `mobile/`, run `npx tsc --noEmit`, `npm run lint`, and `npm test -- --coverage`; fix production/tests rather than weakening thresholds, timeouts, lint, or generated-code checks.
- [x] 8.2 Run `openspec validate add-first-launch-onboarding-and-ical-reminder`, inspect the final diff for accidental sensitive-surface changes, and confirm no OpenAPI/generated client, server migration, native/store/EAS config, deploy/CI workflow, secret, or legacy Flutter path changed.
- [ ] 8.3 Push the exact green head and verify PR checks plus the required Android/iOS native E2E evidence before Reviewer merge; record any non-applicable DoD item with a one-line reason.
