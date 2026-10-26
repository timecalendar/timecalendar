# Tasks

Run commands in `mobile/` unless a task says otherwise. Decisions D1 to D7 are in `design.md`.
Use LSP `findReferences` on `KeyboardSafeActionLayout` and `stepStyles` before changing either.
Add no code comment except a non-obvious why. Docs describe the current state only. Do not touch
the slice 5.1 screens (`welcome-screen`, `connect-screen`, `manual-import-screen`). Never build
Android on the Mac. Land two commits, as in design.md → Migration Plan.

**Files in scope**

| Role | Path |
| --- | --- |
| Route (unchanged, verify only) | `src/app/onboarding/institution-name.tsx`, `src/app/onboarding/programme.tsx`, `src/app/onboarding/ical-url.tsx`, `src/app/feedback.tsx` |
| Screen | `src/features/onboarding/ui/institution-name-screen.tsx`, `src/features/onboarding/ui/programme-screen.tsx`, `src/features/calendar-sources/ui/ical-url-screen.tsx`, `src/features/feedback/ui/feedback-screen.tsx` |
| Screen tests | the four colocated `*.test.tsx` beside the screens |
| Primitive | `src/design/layout/keyboard-safe-action-layout.tsx`, `.test.tsx`, `.gallery.tsx`, `.gallery.test.tsx` |
| Shared style | `src/features/onboarding/ui/step-styles.ts` (delete `formContent` only) |

**Allowlist rows to remove: none.** None of the eight route and screen paths is on any allowlist
under `tools/eslint-rules/`. Every ceiling stays as it is:
`STYLE_LITERAL_ALLOWLIST_CEILING = { colorLiteral: 1, typographyLiteral: 7, legacyShadow: 0, spacingLiteral: 6, radiusLiteral: 3 }`,
`RAW_PRIMITIVE_ALLOWLIST_CEILING = { rawText: 1, rawModal: 0 }`, raw-button 5, ad-hoc-status 2,
raw-text-input 1, ad-hoc-separator 1, header-action 1, raw-event-color 1. Task 0.1 proves this.

## 0. Baseline

- [x] 0.1 Prove the ratchet status. Run
      `rg -n "institution-name-screen|programme-screen|ical-url-screen|feedback-screen|app/feedback|onboarding/(ical-url|institution-name|programme)" tools/eslint-rules eslint.config.js scripts ../scripts`.
      Verify: no match outside test fixtures. If any allowlist entry matches, delete it in task 2.6
      and lower that test's ceiling by the number of rows removed.
- [x] 0.2 Run the audit greps from `docs/mobile/design-system-audit/duplication-and-drift.md` →
      Method on the eight files (bash array, `rg -n --no-heading -e "$p" "${FILES[@]}"`; under
      zsh or rtk call `rtk proxy rg`), plus
      `themeColor|type="(default|small|smallBold|subtitle)"|Pressable|Touchable|TextInput\b|PrimaryAction|useTheme|<Text\b`.
      Verify: the hits match design.md → Context (4 `StyleSheet.create`, `Spacing.` references,
      `feedback-screen.tsx:128` `themeColor`). Use any fresh counts in the PR.

## 1. `KeyboardSafeActionLayout` owns the form rhythm (D1, D2) — commit 1

- [x] 1.1 In `src/design/layout/keyboard-safe-action-layout.tsx`, change the props to the union
      in design.md D2. Resolve the header posture as
      `contentPlacement === "center" ? false : (scrollsUnderHeader ?? true)` and pass it to
      `headerScrollProps`. Delete the `:29-31` comment (the type now carries the rule).
      Verify: `npx tsc --noEmit` reports errors only at the three screens and the gallery fixture
      that still pass `scrollsUnderHeader={false}`. Fix them in 1.3 and 2.x.
- [x] 1.2 Extend `styles`: `content: { paddingTop: Spacing.four, gap: Spacing.three }`,
      `centered: { flexGrow: 1, justifyContent: "center" }`,
      `actions: { gap: Spacing.two, paddingTop: Spacing.three, paddingBottom: Spacing.four }`.
      Content style order is `[laneStyle, styles.content, contentPlacement === "center" && styles.centered, contentContainerStyle]`.
      Action region order is `[laneStyle, styles.actions, actionContainerStyle]`.
      Verify: `npm run lint` passes (tokens only, so no `local/no-style-literals` report).
- [x] 1.3 `keyboard-safe-action-layout.gallery.tsx`: delete the local `styles` (and the `StyleSheet`
      and `Spacing` imports if unused). `FormFixture` passes `contentPlacement="center"` when
      `fillsViewport`, and otherwise `scrollsUnderHeader` (spread a conditional object to satisfy
      the union). `LongStringsFixture` passes neither style prop.
      Verify: `npx jest src/design/layout/keyboard-safe-action-layout.gallery` passes.
- [x] 1.4 `keyboard-safe-action-layout.test.tsx`: add per-platform (`usePlatform`) tests that
      (a) without style props, flattened `form-content` `contentContainerStyle` contains
      `paddingTop: Spacing.four, gap: Spacing.three` and `form-actions` style contains
      `gap: Spacing.two, paddingTop: Spacing.three, paddingBottom: Spacing.four`;
      (b) with `actionContainerStyle={{ paddingBottom: 12 }}`, `paddingBottom` is 12 and `gap` /
      `paddingTop` keep their defaults;
      (c) `contentPlacement="center"` gives `flexGrow: 1, justifyContent: "center"` and a scroller
      with `contentInsetAdjustmentBehavior: "never"` and `alwaysBounceVertical: false`;
      (d) the default placement gives `"automatic"` / `true`.
      Add a `// @ts-expect-error` render of `contentPlacement="center" scrollsUnderHeader` so the
      type rule is a compile-time test.
      Verify: `npx jest src/design/layout --coverage --collectCoverageFrom='src/design/layout/keyboard-safe-action-layout.tsx'`
      passes with at least 90% branches on that file.

## 2. Screens (D3–D5, D7) — commit 1

- [x] 2.1 `institution-name-screen.tsx`: remove `style={stepStyles.fill}` from `RootPage`, replace
      `scrollsUnderHeader={false}` and `contentContainerStyle={stepStyles.formContent}` with
      `contentPlacement="center"`, remove `actionContainerStyle`, then delete `styles`, the
      `StyleSheet`, `Spacing` and `stepStyles` imports. Rewrite the `:23-35` comment as the
      current why only (the name is required because it is the only institution signal; submitting
      clears the stale school selection). Keep every `testID`.
      Verify: `rg -n "StyleSheet|Spacing|stepStyles|scrollsUnderHeader" src/features/onboarding/ui/institution-name-screen.tsx`
      finds nothing.
- [x] 2.2 `programme-screen.tsx`: the same edits as 2.1. Keep the `:26-36` comment.
      Verify: the same `rg` on this file finds nothing.
- [x] 2.3 `ical-url-screen.tsx`: remove `style={styles.fill}`, use `contentPlacement="center"`,
      remove `scrollsUnderHeader={false}`, `contentContainerStyle` and `actionContainerStyle`,
      then delete `styles` and the `StyleSheet`/`Spacing` imports. Cut the `:36-55` comment to the
      current why (two failure classes and which one is recorded, the server POST not a client
      parse, the draft-not-selection attribution) without slice or ship history.
      Verify: `rg -n "StyleSheet|Spacing|scrollsUnderHeader" src/features/calendar-sources/ui/ical-url-screen.tsx`
      finds nothing.
- [x] 2.4 `feedback-screen.tsx`: remove `actionContainerStyle` and the `actions` style, keep
      `scrollContent` and `content`, and change `themeColor="textSecondary"` to `tone="secondary"`.
      Verify: `rg -n "themeColor|actionContainerStyle" src/features/feedback/ui/feedback-screen.tsx`
      finds nothing.
- [x] 2.5 `step-styles.ts`: delete `formContent` and make the header comment name its consumers
      (connect and manual import) in current-state terms. If slice 5.1 has already rewritten or
      removed the file on `origin/main`, rebase and keep its version (D3).
      Verify: `rg -n "formContent" src` finds nothing.
- [x] 2.6 Allowlists: only if 0.1 found a row, delete it and lower the matching
      `*_ALLOWLIST_CEILING` by the rows removed. Verify: `npx jest tools/eslint-rules` passes
      (an unchanged run is expected).
- [x] 2.7 Screen tests. Keep the existing assertions green:
      `institution-name-screen.test.tsx:184`, `programme-screen.test.tsx:264` and
      `ical-url-screen.test.tsx:178-183` still find `flexGrow: 1` (and `justifyContent: "center"`).
      Add (a) in `feedback-screen.test.tsx`, an assertion that `feedback-action-region`'s flattened
      style contains `gap: Spacing.two, paddingTop: Spacing.three, paddingBottom: Spacing.four`,
      and a pending-state assertion that the "Sending…" text's flattened color is
      `Colors.light.textSecondary`; (b) in `ical-url-screen.test.tsx`, that the
      `ical-url-keyboard-layout-content` scroller has `contentInsetAdjustmentBehavior: "never"`.
      Verify: `npx jest src/features/onboarding src/features/calendar-sources src/features/feedback`
      passes.
- [x] 2.8 Selectors: `.maestro/01-fresh-user-import.yaml` and `e2e/maestro-selectors.test.ts`
      are unchanged. Verify: `git diff --stat -- .maestro e2e` is empty and
      `npx jest e2e/maestro-selectors` passes.
- [x] 2.9 Re-run the 0.2 greps. Verify: the only hits left are `feedback-screen.tsx`'s one
      `StyleSheet.create` and its `Spacing.four` references (`scrollContent`, `content`). The other
      three screens have no hit at all. Record the output for the PR.
- [x] 2.10 Commit 1.

## 3. CI proof

- [ ] 3.1 The runtime change is layout defaults. They are proven in CI by
      `keyboard-safe-action-layout.test.tsx` (defaults, override, placement, the
      `@ts-expect-error` type rule through `tsc`), the gallery fixture test and the four screen
      suites in `test-mobile`, and by `lint-mobile` with no allowlist growth.
      Verify: after push, the PR's mobile jobs in `.github/workflows/ci-mobile.yml` are green and
      the `test-mobile` log lists `keyboard-safe-action-layout.test.tsx` and the four screen
      suites.

## 4. Local verification

- [x] 4.1 `npx tsc --noEmit` passes.
- [x] 4.2 `npm run lint` passes with zero warnings.
- [x] 4.3 `npm test -- --coverage` passes, including the 90% per-file branch tiers, the allowlist
      suites, the design import-graph contract and FR/EN parity. Record suite and test counts for
      the PR.
- [x] 4.4 `npm run react-doctor:changed` reports no new warning on the changed files.
- [x] 4.5 From the repo root, `openspec validate migrate-mobile-form-screens-to-design-system`
      passes.

## 5. Architecture Book (`docs/mobile/architecture-book/`) — commit 2

- [ ] 5.1 `theming.md` → Native-chrome wrapper seam (the paragraph at `:509-514`):
      `KeyboardSafeActionLayout` owns the form rhythm (content `paddingTop four` / `gap three`,
      action region `gap two` / `paddingTop three` / `paddingBottom four`, caller styles last) and
      `contentPlacement="center"` for forms that fill the viewport. Name institution name,
      Programme, iCal URL, Feedback and the personal-event editor as its consumers. Link
      `keyboard-safe-action-layout.test.tsx`.
      Verify: `rg -n "contentPlacement" docs/mobile/architecture-book/theming.md` matches.
- [ ] 5.2 `navigation.md:39-43`: the centred form is `KeyboardSafeActionLayout contentPlacement="center"`,
      whose type rejects `scrollsUnderHeader` (the gate). Replace "takes `scrollsUnderHeader={false}`".
      Verify: `rg -n "scrollsUnderHeader=\{false\}" docs/mobile/architecture-book/navigation.md`
      finds nothing.
- [ ] 5.3 `features.md`: in the bullet at `:198-203`, name institution name and iCal URL beside
      Feedback and Programme as keyboard-safe forms whose screens pass no layout style (centred
      placement for the three onboarding-journey steps). Keep the rows at `:27` and `:29` true.
      Verify: the bullet names all four screens.
- [ ] 5.4 `decisions/054-shared-root-page-semantics.md` → Decision: extend the
      `KeyboardSafeActionLayout` sentence (`:30-31`) to say that it also supplies the action-region
      rhythm and the centred placement. Write it as current state, without "amended".
      Verify: `rg -n "action-region rhythm|contentPlacement" docs/mobile/architecture-book/decisions/054-shared-root-page-semantics.md`
      matches.
- [ ] 5.5 `CHANGELOG.md`: add `## 2026-10-26 — Form screens on the design system` above the
      current first entry, with bullets for: the layout-owned rhythm (theming.md, ADR 054), the
      type-enforced centred placement (navigation.md), and the four screens composing only
      `@/design` with no allowlist entry (features.md). Verify: the entry is first and every link
      resolves.
- [ ] 5.6 Outside the Book: `docs/react-native-migration/inbox/2026-10-26-mobile-ds-form-screens-device-pass.md`
      exists (written at planning). Update it if a story id or route changed. Verify: the three
      story ids are produced by `src/design/gallery/stories.ts`
      (`keyboard-safe-action-layout--default`, `--fills-viewport`, `--long-strings`).
- [ ] 5.7 Commit 2. Verify: `npm run lint`, `npm test -- --coverage` and the openspec validate
      still pass.

## 6. Device verification

- [ ] 6.1 iOS simulator pass (run by the conductor, iOS build on the Mac with Xcode 26.6), in
      light and dark, at the default text size and at accessibility-extra-extra-extra-large (AX5):
      - **Gallery:** `timecalendar-dev://developer/gallery/keyboard-safe-action-layout--default`,
        `--fills-viewport`, `--long-strings`.
      - **Screens:** school picker → "I can't find my school" → institution name (empty submit
        shows the error) → Programme (Skip in the bar, Continue disabled while empty) → providers
        → guide → manual import → iCal URL (invalid URL error; Import); Settings → Feedback (focus
        e-mail then message; empty submit errors).
      Check: centred forms do not scroll by the header height; the action region sits directly
      above the keyboard with the same spacing on every form; Feedback's Send has 12 pt above it
      and no clipped text at AX5; Continue/Import/Send are never covered by the keyboard; the
      sending status is secondary-colored in both schemes.
      Verify: screenshots recorded for the PR; anything not checked is listed by name.
- [ ] 6.2 Android device and TalkBack pass (HUMAN: see inbox/2026-10-26-mobile-ds-form-screens-device-pass.md).
      Skip and continue; this does not block the PR.
