## 1. Focused event-details composition

- [ ] 1.1 Extract translated loading and not-found presentation from `mobile/src/features/calendar/ui/event-details-screen.tsx` into focused calendar UI components, preserving the standard header, safe-area layout, accessibility role/live-region/label behavior, and loading-versus-not-found distinction; verify through the direct loading and not-found component cases.
- [ ] 1.2 Extract one resolved-event UI action hook that calls `useHiddenEvents` and `useHideActions` once and returns the header action plus hide failure state; preserve the visible-synced chooser, success-only `router.back()`, hide-by-name path, uid-and-name deep-link unhide without navigation, exact personal edit route, translations, role, hit target, and write-error propagation.
- [ ] 1.3 Extract presentational header and resolved content modules for the title/color, duplicate-preserving tags, optional content lines, updated footer, and checklist; preserve existing spacing/styles, accessibility, explicit locale/display-zone/all-day formatting, two-calendar name threshold, unresolved-calendar omission, and whitespace-safe fallback.
- [ ] 1.4 Reduce the exported `EventDetailsScreen` function to explicit route/read/locale inputs and loading, not-found, and resolved-event outcomes below 200 lines; keep extracted modules internal to the calendar `ui/` sublayer, retain the existing `ui/index.ts` and feature-barrel export, and verify lint-enforced sibling-barrel dependency direction.
- [ ] 1.5 Remove only the former screen's `useCallback`/`useMemo` wrappers after confirming no extracted consumer depends on referential identity and no expensive calculation is introduced; leave memoization in unchanged data, renderer, checklist, and other feature modules untouched.

## 2. Direct behavior and regression proof

- [ ] 2.1 Reshape `mobile/src/features/calendar/ui/event-details-screen.test.tsx` and/or add focused colocated tests so loading, not found, synced visible, synced hidden, and personal branches remain directly named and covered through the real extracted boundaries; reset Alert/router and other suite-owned mocks in exception-safe teardown.
- [ ] 2.2 Retain direct header-action proofs for hide-this-uid, hide-by-name, no back navigation plus visible error on failed hide, unhide-by-uid, unhide-by-name, simultaneous uid-and-name unhide, synced action exclusivity, and the exact personal push `/personal-event-form?uid=pers-1`.
- [ ] 2.3 Retain content proofs for timed and all-day formatting, resolved locale/display zone, calendar-name threshold and whitespace fallback, optional fields, translated updated footer, accessible heading/color/loading/error semantics, and checklist mounting for both synced and personal uids.
- [ ] 2.4 Add a fixture with two identical `{ name, color, icon }` tags and prove both bubbles render. Do not use name alone as a key or add an API/data-layer identifier without committed-contract proof; document any occurrence-aware key diagnostic with the stateless tag-node rationale.
- [ ] 2.5 Run the focused CI proof suite with `cd mobile && npm test -- --runInBand src/features/calendar/ui/event-details-screen.test.tsx` plus any new colocated event-details test path, and keep those tests in normal Jest discovery so the existing `test-mobile` job proves the refactor on every PR push.

## 3. Architecture and diagnostic evidence

- [ ] 3.1 Update `docs/mobile/architecture-book/calendar.md` in the Event details surface entry to describe the current thin state orchestration and focused feature-internal action/content ownership, without adding a new architectural rule or ADR for this reversible refactor.
- [ ] 3.2 Run `cd mobile && npx -y react-doctor@latest --verbose --scope changed` after implementation and confirm `EventDetailsScreen` is absent from `react-doctor/no-high-complexity-react-function`; measure and record the exported function's line count below 200.
- [ ] 3.3 Classify every other React Doctor diagnostic in changed files as fixed, false positive, or evidence-backed limitation in the PR body/handoff, citing the relevant code and contract evidence. Do not install React Doctor, change its configuration, add suppressions, or broaden into unrelated findings.

## 4. Local green and handoff evidence

- [ ] 4.1 Format every touched TypeScript, Markdown, and OpenSpec file and run targeted ESLint on all changed mobile TypeScript/TSX files with zero warnings; fix code rather than weakening formatting or lint checks.
- [ ] 4.2 Run `cd mobile && npx tsc --noEmit`, then run the complete `cd mobile && npm test -- --runInBand` suite when practical and record whether Jest exits naturally; if a pre-existing lifecycle failure appears, preserve the focused proof and report exact evidence without changing unrelated harness behavior.
- [ ] 4.3 Run `openspec validate simplify-mobile-event-details-screen --strict` and keep the implementation task checkboxes accurate before the apply handoff.
- [ ] 4.4 Confirm the implementation diff does not touch `openapi/openapi.json`, `mobile/src/api/generated/`, server migrations, mobile native/store/EAS/Firebase configuration, secrets/certificates, infrastructure, workflows, or legacy Flutter `app/`; flag any unexpected exact path and risk in the PR body and handoff before proceeding.
- [ ] 4.5 Push implementation and verification commits to the existing branch and update the single draft PR body to mark apply complete with exact focused-test, TypeScript, lint, full-Jest natural-exit, React Doctor, line-count, Architecture Book, CI-proof, native-E2E limitation, and sensitive-surface results; run the configured disclosure scan before the GitHub write and re-read the body afterward to verify it landed.
