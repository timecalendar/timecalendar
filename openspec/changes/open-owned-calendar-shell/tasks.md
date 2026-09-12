## 1. Lock the T01 behavior with focused tests

- [x] 1.1 Add a focused owned-shell component suite that renders the canvas, queries the selected date by heading role, checks theme-backed full-size presentation, and proves French/English plus effective-display-zone formatting; run it with `npm test -- --runTestsByPath <owned-shell-suite>`.
- [x] 1.2 Rewrite the affected Calendar screen/controller tests to cover shell mount/unmount, tab-equivalent unmount/remount, shell-to-Agenda switching, valid focus-date and retained Today behavior only if observable, Agenda refresh/retry, fabricated synced and personal agenda events opening the unified details route, and return usability; run every edited suite with `npm test -- --runTestsByPath <all-edited-calendar-suites>`.
- [x] 1.3 Add a CI repository-contract test that fails if calendar-kit package/lock entries, imports, renderer adapter/vendor files, its patch or Jest setup, its renderer-only coverage rule, its ESLint ban/exception, or a duplicate/fallback renderer reappears; also pin the exact three top-level Maestro journeys and retained `mobile/.maestro/helpers/open-calendar-agenda.yaml`, then run the new suite.

## 2. Install the minimal owned renderer

- [x] 2.1 Create the feature-private owned shell under `mobile/src/features/calendar/renderer` using React Native views, theme tokens, semantic text, a stable canvas test selector, and a localized selected-date heading; expose no ref, event collection, navigation callback, gesture, scrolling, or public compatibility API, and verify with the focused renderer suite.
- [x] 2.2 Simplify `calendar-screen.tsx` and `use-calendar-screen-controller.ts` to one screen-owned selected date and the bounded Agenda range, remove timeline ref/visible/settled callback and vendor event-window coupling, keep existing valid focus-date handling without motion, and ensure the shell never reports stored events as an empty-data result; verify through the focused Calendar suite.
- [x] 2.3 Narrow iOS and Android Calendar view menus to distinct working shell/Agenda choices, remove the Day choice until T05, retain Add and only retain Today if it changes the selected date/heading, and preserve translated labels, selected state, and 44pt/48dp targets; verify both platform branches in the Calendar/header/menu suites.
- [x] 2.4 Preserve Agenda's measured lane, bounded event read, checklist progress, refresh/retry, synced/personal event activation, event-details route, and return navigation without changing event facts or storage; run the affected Agenda, Calendar screen, route, and event-details suites.

## 3. Remove the vendor footprint coherently

- [x] 3.1 Delete `mobile/src/features/calendar/renderer/calendar-kit/`, obsolete renderer types/window exports, and vendor-only tests; update the renderer barrel to export only the owned shell and run the renderer plus Calendar suites without a global vendor mock.
- [x] 3.2 Remove `@howljs/calendar-kit` from `mobile/package.json` and `mobile/package-lock.json`, delete its sole patch, and remove `patch-package` plus the postinstall hook because no other patch remains; run `npm ci` followed by `npm ls --depth=0` and confirm the manifests are consistent.
- [x] 3.3 Delete `mobile/jest/calendar-kit/setup.ts`, its Jest setup entry, and renderer adapter/window coverage exception; remove the calendar-kit restricted-import pattern and vendor seam block from `mobile/eslint.config.js` while preserving every unrelated rule and coverage threshold; run the Jest config and repository-contract suites plus `npm run lint`.
- [x] 3.4 Update vendor-specific comments in the root layout, Calendar tests, app-tabs test, and pure Calendar helpers to describe the current owned/runtime boundaries; retain `GestureHandlerRootView`, Gesture Handler, Reanimated, Worklets, and unrelated dependencies, then use `rg` plus the repository-contract test to prove no live mobile calendar-kit reference remains.

## 4. Reconcile current documentation and owner evidence

- [x] 4.1 Update `docs/mobile/architecture-book/calendar.md` and `docs/mobile/architecture-book/CHANGELOG.md` to state the current T01 owned shell contract, retained Agenda/details behavior, and intentionally absent events, paging, vertical scrolling, weekday columns, day/week switching, zoom, and later renderer capabilities; do not rewrite historical ADRs or claim renderer/launch completion.
- [x] 4.2 Review the Architecture Book decision index and record in the change that D02/D03/D04/D07 already govern this cut, so no new ADR is required unless implementation changes a costly-to-reverse binding rule; run the book's applicable link/format checks and scoped Prettier verification.
- [x] 4.3 Create or update the migration inbox owner-QA note with `(HUMAN: owner device verification)` and provide a fresh-install test build or exact immutable build/launch instructions, fabricated local fixture version and setup/reset steps, tested revision, device/build fields, the T01 checklist, and the explicit absent-capability list; do not use personal calendar content or claim unrun device results.

## 5. Local-green and CI proof

- [x] 5.1 From `mobile/`, run every edited test suite and focused shell/screen/config/selector suites with `npm test -- --runTestsByPath ...`; record exact commands, counts, outcomes, and the tested Git revision.
- [x] 5.2 From `mobile/`, run the applicable coverage command including the owned renderer and affected Calendar suites, then run `npx tsc --noEmit`, `npm run lint`, scoped `npx prettier --check <edited-files>`, `npm run react-doctor:changed`, and the established Maestro selector/harness regression checks; preserve all three journeys and record that native Maestro was not run on this host.
- [x] 5.3 Run `openspec validate open-owned-calendar-shell --strict`, the dependency/install checks, and a final repository audit for vendor imports, fallback/duplicate renderers, silent no-op controls, sensitive-surface drift, and unexpected changes under OpenAPI/generated API, server migrations, native/store config, deployment/CI, or legacy Flutter paths.
- [x] 5.4 Push the tested implementation revision to the existing draft PR and update its body with exact verification results, build/fixture instructions, sensitive-surface statement, remaining T01 owner checks, and the explicit capability limits; run the disclosure scan before publication and re-read the PR body after writing it.

## 6. Owner acceptance hold

- [x] 6.1 Provide the owner with the immutable build/revision and checklist to verify Calendar open, accessible localized heading and canvas, Agenda-to-details-and-back, repeated tab leave/return, and the stated capability limits on a fresh fabricated-data installation; pause for explicit results and acceptance.
- [x] 6.2 Keep the PR unmerged and auto-merge disabled while owner QA and human review are pending; record each checklist result and focused retest evidence on this same ticket, and do not start, assign, or wake the next renderer ticket.
