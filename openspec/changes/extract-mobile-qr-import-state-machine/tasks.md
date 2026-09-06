## 1. Establish the controller state contract

- [ ] 1.1 Add the QR-import attempt and discriminated state types under
  `mobile/src/features/calendar-sources/ui/`: scanning (with optional invalid-payload guidance),
  importing (captured attempt), failed (captured attempt), and completed. Verify TypeScript makes
  retry unavailable without a failed attempt and does not permit independent failure/import flags.
- [ ] 1.2 Implement `useQrImportController` as the sole owner of barcode, import, retry, Scan
  another, manual URL, completion, and disposal transitions. Capture a shallow field snapshot,
  parse through the existing data barrel, and inject/use the established add-calendar, draft-clear,
  journey-exit, manual-route, and error-recording seams without adding a dependency or persistence.
- [ ] 1.3 Keep synchronous controller-private guards for scan claiming, in-flight exclusion,
  activity, and exactly-once completion. Close gates before async work, check activity/completion
  before every settlement effect, and retain the lifecycle cleanup effect; verify no reducer or view
  performs navigation, recording, persistence, or ref mutation.
- [ ] 1.4 Make invalid payload return to an armed scanning phase without recording; make failure
  release in-flight exclusion while retaining the attempt; make retry reuse that exact attempt;
  make Scan another the only command that clears it; and make manual URL preserve both attempt and
  draft. Verify each command is phase-gated and a rapid second command is a no-op.

## 2. Decompose the scanner presentation

- [ ] 2.1 Reduce `qr-scan-screen.tsx` to a composition shell that reads camera permission,
  add-calendar, import fields, and draft seams, instantiates the controller, and selects a view from
  permission/controller state. Keep the default export and existing feature/public barrels stable.
- [ ] 2.2 Extract cohesive permission loading/request/settings views. Preserve all existing
  translated text, `qr-scan-grant` / `qr-scan-open-settings` IDs, accessibility roles/labels/live
  regions, theme tokens, settings action, and minimum target sizing verbatim.
- [ ] 2.3 Extract the QR-only scanner plus invalid-payload and importing/progress presentation.
  Preserve `qr-scan-camera`, barcode settings, viewfinder label/hint, theme layout, and immediate
  callback exclusion. Progress adds no new copy or dwell state.
- [ ] 2.4 Extract the terminal success and failure/recovery presentation. Success remains an
  immediate exactly-once exit with no new copy or dwell state; failure preserves `WriteErrorNotice`,
  Retry, Scan another, manual URL, their current IDs/a11y props, and disabled semantics.
- [ ] 2.5 Inspect component and file sizes after extraction. No component may be materially above
  200 lines, and view modules must accept state/commands as props rather than importing the data
  seam, onboarding draft, Firebase seam, generated client, or router.

## 3. Pin transitions and integration in focused tests

- [ ] 3.1 Add direct controller-hook tests using deferred promises for a valid normalized scan and
  synchronous suppression of repeated camera callbacks while importing and failed. Assert one
  add-calendar call and one exactly-once draft-clear/journey-exit on success.
- [ ] 3.2 Prove invalid payload displays recoverable guidance, starts no operation, records nothing,
  and accepts the next valid scan without an explicit reset.
- [ ] 3.3 Prove an initial backend rejection records once and retains recovery; a rejected retry
  records once per invocation; and rapid Retry plus camera inputs never start a concurrent or extra
  invocation.
- [ ] 3.4 Change the current import fields and next camera payload after failure, then prove Retry
  still sends the originally normalized URL and captured fields. Prove Scan another clears that
  attempt and accepts a new URL, while manual URL pushes `/onboarding/ical-url` without draft clear
  or private route parameters.
- [ ] 3.5 Unmount with an invocation pending and settle it once by resolve and once by reject.
  Assert no navigation, draft clear, error record, React state update, or console warning in either
  case.
- [ ] 3.6 Retain screen integration coverage for permission loading/request/settings/granted,
  direct-route empty metadata, the real parser boundary, every visible recovery action, translations,
  accessibility props, and existing test IDs. Follow RNTL 14 async helpers and use no timer race,
  query-timeout increase, test retry, or weakened matcher.
- [ ] 3.7 Run the focused CI proof from `mobile/`:
  `npm test -- --runInBand src/features/calendar-sources/ui/qr-scan-screen.test.tsx <new-controller-test-path>`.
  Confirm it covers valid scan, invalid payload, backend failure, retry, duplicate suppression, Scan
  another, manual URL, and both unmount settlements.

## 4. Diagnostics and local-green verification

- [ ] 4.1 Run React Doctor from `mobile/` against every changed QR-import `.ts`/`.tsx` file with
  `npx -y react-doctor@latest --no-score --no-supply-chain <changed-files>`. Record every remaining
  finding as fixed, actionable, or false positive with its exact code/test evidence; do not add an
  inline suppression merely to clear the attempt warning.
- [ ] 4.2 Run `npx tsc --noEmit` and `npm run lint` from `mobile/`; both must be green with the
  existing feature dependency direction and public barrels intact.
- [ ] 4.3 Run the full mobile suite from `mobile/` with `npm test -- --runInBand` when practical.
  Record whether it passes and exits naturally; if it is not practical, record the concrete reason
  and the focused proof from 3.7 rather than implying a full-suite result.
- [ ] 4.4 Run `openspec validate extract-mobile-qr-import-state-machine --strict` and
  `git diff --check`. Rehearse archive in a run-owned scratch copy and confirm the delta adds only the
  intended `mobile-qr-scan` requirements without dropping existing scenarios; do not archive the
  live branch.

## 5. Architecture Book, scope, and CI proof

- [ ] 5.1 Re-read `docs/mobile/architecture-book/features.md`, `navigation.md`, `testing.md`, and
  decisions 014, 017, 044, and 047 after implementation. Record the Architecture Book update as
  N/A if its current QR retry/lifecycle, feature-boundary, navigation, and test contracts remain
  accurate. If implementation requires any binding-rule change, stop and flag the exact scope
  expansion for Architecture Book/ADR treatment before editing it.
- [ ] 5.2 Walk `docs/mobile/architecture-book/definition-of-done.md`. Record automated axes as
  verified and user-visible/device/analytics axes as N/A because this is a behavior-preserving
  internal refactor with no new copy, interaction, dependency, or native behavior.
- [ ] 5.3 Audit the final path diff: outside this OpenSpec change, production/test edits are limited
  to `mobile/src/features/calendar-sources/ui/`. Confirm no OpenAPI/generated client, migration,
  native/store/EAS/Firebase configuration, secret, deployment/CI, legacy Flutter, translation,
  route, or binding Architecture Book edit.
- [ ] 5.4 Push the implementation head and confirm the standard mobile CI run is for the exact PR
  head and is green, including TypeScript, lint, and Jest. Treat the focused QR suite as the CI proof
  test for the transition contract; no camera/device QA or production action is part of this change.
