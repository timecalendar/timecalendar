## 1. Encode heading semantics in `ThemedText`

- [x] 1.1 In `src/components/themed-text.tsx`, default `accessibilityRole` to `"header"` when `type` is `"title"` or `"subtitle"`, merged so a caller-supplied `accessibilityRole` still wins (default only when unset; props spread preserves the explicit value).
- [x] 1.2 Confirm body/default variants do **not** get the header role.

## 2. Verify/correct skeleton screen semantics

- [x] 2.1 `src/components/schools-screen.tsx`: confirm the title now inherits the header role via `ThemedText type="title"` (no per-call-site role needed); make the loading/error status accessible (e.g. `accessibilityRole`/`accessibilityLiveRegion="polite"` on the status text) — minimal, since this screen dies with real onboarding.
- [x] 2.2 Home (`(tabs)/index.tsx`) and Profile (`(tabs)/profile.tsx`) stubs: confirm their titles use `ThemedText type="title"`/`"subtitle"` so they inherit the header role; no other change.
- [x] 2.3 Do **not** add any touchable/interactive control to exercise the `react-native-a11y` touchable rules — they go live with the first real control (R-2).

## 3. Prove the wiring in CI

- [x] 3.1 Add a unit test (extend `src/components/themed-text.test.tsx` or colocate a new test) that renders a `ThemedText type="title"` and asserts the accessibility tree resolves the header role — `getByRole('header')` finds the title node. Await `render` per the RNTL 14 harness convention.
- [x] 3.2 Add the negative-path assertion: a default-variant `ThemedText` is not found by `getByRole('header')`.
- [x] 3.3 Add the explicit-role-wins assertion: a `type="title"` with an explicit `accessibilityRole` keeps the caller's role.
- [x] 3.4 Confirm the existing `schools-screen` and `themed-text` tests still pass (or update assertions to the now-header-bearing title).

## 4. Gates

- [x] 4.1 `npx tsc --noEmit` clean.
- [x] 4.2 `npm run lint` clean with `--max-warnings 0` (the four `react-native-a11y` rules + `i18next/no-literal-string` unchanged; no new suppressions).
- [x] 4.3 `npm test` green.

## 5. Docs

- [x] 5.1 Add an a11y section to `.claude/rules/mobile/architecture.md`: what the live lint rules enforce and where they bite (with the pointer to `mobile-lint-format`), the `ThemedText` heading-role contract, the note that the touchable rules are live-but-unexercised until the first interactive control, the CI proof, and — per R-1 — the prose rules for what lint can't encode (Dynamic Type / font scaling, touch-target minimums, meaningful-label review, manual screen-reader passes, reduced motion, contrast) each with its reason and owner, plus the deferred-debt list.
- [x] 5.2 Resolve the lint-section note that says "the strings + a11y rules from steps 6–7 are already live" — point it at the now-complete a11y section.
- [x] 5.3 Mark step 7 done in `docs/react-native-migration/01-roadmap/01-foundation.md`.
