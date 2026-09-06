## 1. Shared responsive foundation (TIM-499)

- [ ] 1.1 Add a pure measured-width resolver and the smallest shared lane/container primitive for compact/tablet mode, readable/standard/full-bleed widths, and token-based adaptive gutters; prove 390/599/600/768/800/834/1024 plus nested-width behavior in focused tests.
- [ ] 1.2 Apply only necessary shell alignment in the existing Stack/native-tabs/chrome seams, preserving safe-area ownership and the iOS form-sheet/Android full-screen changelog presentation; verify route option and chrome boundary tests.
- [ ] 1.3 Create `docs/mobile/tablet-quick-wins.md` from Design Decision 5, record the actual foundation API/rules, and update the theming/navigation Architecture Book pages plus `CHANGELOG.md` with the reusable current-state contract.

## 2. Scheduling surfaces (TIM-500)

- [ ] 2.1 Migrate Home frame/header/statuses to the standard lane and make Today timeline geometry consume its measured container width; add phone/tablet tests for welcome, upcoming, empty/error, dense overlaps, and 834+ composition if retained.
- [ ] 2.2 Keep Calendar day/week full bleed, center agenda and its states in the standard lane, and verify header/menu/FAB alignment, renderer width, gestures, and dense event tiles at every target width.
- [ ] 2.3 Move event details/checklist to the readable lane (using 834+ grouped composition only if accessibility order is proven) and cover loaded/loading/not-found/error plus checklist interactions.
- [ ] 2.4 Migrate the personal-events list to the standard lane and the create/edit/delete form plus sticky footer to the readable lane; verify keyboard, validation, native pickers, alerts, and phone parity.
- [ ] 2.5 Update the scheduling rows in `docs/mobile/tablet-quick-wins.md` with shipped/no-change outcomes and focused test commands.

## 3. Onboarding and sources (TIM-501)

- [ ] 3.1 Recompose the welcome pager with a standard outer lane and bounded illustration/readable copy regions; verify all pages, reduced motion, large text, and controls at phone and target tablet widths.
- [ ] 3.2 Move connect, institution-name, programme, manual-import, and iCal URL steps to the readable lane while preserving route sequence, validation, keyboard, and action order; add focused responsive tests.
- [ ] 3.3 Align school picker rows/separators/header/footer/statuses and group picker hierarchy to the standard lane; verify populated/search/no-result/loading/error/empty and deep tree states.
- [ ] 3.4 Keep the QR camera full bleed while bounding its viewfinder guidance/status/actions; cover every permission/import state and tablet overlay placement without changing scanning behavior.
- [ ] 3.5 Own the shared user-calendars screen/rename-dialog responsive edit (standard list, readable dialog), coordinate the Settings entry as read-only integration, and verify empty/list/FAB/header/rename/delete/large-font states.
- [ ] 3.6 Update the onboarding/source rows in `docs/mobile/tablet-quick-wins.md` with shipped/no-change outcomes and focused test commands.

## 4. Settings, management, and utilities (TIM-502)

- [ ] 4.1 Migrate Settings hub to the standard lane and appearance/timezone/notification controls to the readable lane; if 834+ whole-section columns are retained, prove stable source/focus order and single-column fallback.
- [ ] 4.2 Migrate hidden-events and Activity to the standard lane with consistent loading/empty/error/footer treatment; verify dense, paged, destructive, and accessibility states.
- [ ] 4.3 Migrate About/changelog history/feedback inner content to readable/standard lanes and preserve native sheet/keyboard/link/form behavior; add focused phone/tablet state tests.
- [ ] 4.4 Verify Splash and dev-import remain centered without stretching and `/profile` plus `/more` remain routing-only redirects; record explicit no-change outcomes.
- [ ] 4.5 Verify the Settings entry to user calendars against TIM-501's owned screen without editing its responsive layout concurrently.
- [ ] 4.6 Update the settings/utility rows in `docs/mobile/tablet-quick-wins.md` with shipped/no-change outcomes and focused test commands.

## 5. Architecture and local green

- [ ] 5.1 Confirm the Architecture Book states container measurement, 600 tablet semantics, readable/standard/full-bleed lanes, 834+ bounded columns, and native presentation ownership; add an ADR only if implementation changes a costly-to-reverse decision beyond this contract.
- [ ] 5.2 From `mobile/`, run formatting verification, `npx tsc --noEmit`, lint, focused responsive/feature Jest tests, and the repository-prescribed coverage suite; record exact commands/results in the audit ledger.
- [ ] 5.3 Run static route/chrome and Maestro-selector validation; confirm no dependency, API/generated-client, schema, native config, orientation, multitasking, or legacy Flutter diff.

## 6. CI proof and final full-route pass (TIM-503)

- [ ] 6.1 Ensure the responsive resolver and screen component tests run in the normal mobile CI lane, including explicit 599/600 boundary and 390/768/800/834/1024 proofs.
- [ ] 6.2 Exercise every matrix row in light/dark and relevant loading/empty/error/dense/keyboard/large-font states on available iOS and Android portrait simulators/emulators; capture useful evidence without creating a human or physical-device gate.
- [ ] 6.3 Reconcile `docs/mobile/tablet-quick-wins.md` so every row records the shipped implementation or an explicit verified no-change outcome; flag non-quick-win ideas as separate follow-ups rather than expanding this change.
- [ ] 6.4 Pull current `main`, resolve/retest integration conflicts, require normal automated checks to pass, and verify the final diff still excludes dependencies, business behavior, native orientation/device configuration, API/schema/generated code, and legacy Flutter.
