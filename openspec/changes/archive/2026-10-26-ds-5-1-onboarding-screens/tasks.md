# Tasks

Run commands in `mobile/` unless a task says otherwise. Decisions D1 to D7 are in `design.md`. Use
LSP `findReferences` before removing or renaming a symbol. Add no code comment except a
non-obvious why. Docs describe the current state only (no "now", "previously", "changed from").
Tests, specs and docs name no real person or account. Never build Android on the Mac.

**Do not touch slice 5.2 files** (a parallel change owns them): `institution-name-screen.tsx`,
`programme-screen.tsx`, their tests, `step-styles.ts`, `app/onboarding/{institution-name,programme,ical-url}.tsx`,
`features/calendar-sources/ui/ical-url-screen.tsx`, and the feedback feature.

## 0. Baseline

- [x] 0.1 Re-run the ratchet census: `rg -n "onboarding/ui|app/onboarding" tools/eslint-rules/*-allowlist.js`.
      Verify: no hit (design D5). If a 5.1 file is listed after all, delete its row and lower the
      matching ceiling in the sibling `*-allowlist.test.js` by the number of rows removed, and record
      the row and ceiling in the PR body.
- [x] 0.2 Re-run the scoped audit greps (`docs/mobile/design-system-audit/duplication-and-drift.md:28-66`,
      the `S()` helper) over the twelve 5.1 files listed in design D4, in `bash` with the paths in
      an array (zsh does not word-split). Verify: the hits match design → Context's residue table;
      if they differ, use the fresh hits.

## 1. Migrated-screen contract (D4) — commit 1

- [x] 1.1 Create `src/design/screen-migration.contract.test.ts` modelled on
      `src/theme/brand-small-text.test.ts` (`jest.requireActual("node:fs")`/`node:path`, paths
      resolved from `process.cwd()`). Export nothing. Define `MIGRATED_SCREENS` with one entry
      `{ slice: "5.1", files: [...] }` holding the twelve paths from design D4, and
      `DRIFT_PATTERNS` (`{ id, pattern }`) for: color literal (hex / `rgba(` / `hsla(` / named
      color string), numeric spacing key, numeric radius key, numeric `fontSize|lineHeight|letterSpacing`,
      `fontWeight:`, `fontFamily:`, legacy shadow keys, `useColorScheme|Appearance.`, `style={{` /
      `contentContainerStyle={{`, `hairlineWidth`, literal `opacity`, literal `border*Width`,
      literal `hitSlop={`, `<ActivityIndicator`, `<SymbolView`, `min(Height|Width): 44|48`,
      `Platform.(OS|select)` with `44`/`48` on the same line, `themeColor=`, and
      `type="(default|small|smallBold|subtitle)"`. Use the audit's regexes verbatim where they exist.
      `findDrift(source)` strips `/* */` blocks and `//` line comments (keeping line numbers) and
      returns `{ id, line }[]`.
      Tests: (a) the detector reports one hit per pattern in a fixture string and none for a
      commented-out `themeColor="x"`; (b) every listed path exists; (c) no path is listed twice;
      (d) every listed file has no drift (failure message `path:line id`).
      Verify: `npx jest src/design/screen-migration.contract` fails on the current tree with
      `welcome-pages.tsx` `themeColor`, `welcome-page-indicator.tsx` touch-target, and passes (a)–(c).
      Paste the failing output into the PR body (red half of the inject-and-revert proof).

## 2. Screen migration (D1–D3, D6) — commit 1

- [x] 2.1 `src/features/onboarding/ui/welcome-pages.tsx`: body `themeColor="textSecondary"` →
      `tone="secondary"` (D1); hoist `maxWidth: 480` to a module constant
      `ILLUSTRATION_MAX_WIDTH` used by `styles.illustrationCard`. Verify: `npx tsc --noEmit` passes;
      `rg -n "themeColor|maxWidth: [0-9]" src/features/onboarding/ui/welcome-pages.tsx` is empty.
- [x] 2.2 `src/features/onboarding/ui/welcome-page-indicator.tsx`: delete `CONTROL_MIN_HEIGHT` and
      the `Platform` import; `styles.indicator.minHeight` = `MinTouchTarget`;
      `INDICATOR_ANIMATION_MS` → `Motion.fast` (D3). Keep the pill width constants, colors, testIDs
      and the grouped accessibility label. Verify: `rg -n "Platform|44|48|150" <file>` is empty.
- [x] 2.3 `src/features/onboarding/ui/welcome-entrance.tsx`: `FADE_IN_MS` → `Motion.base` (D3,
      Decision). Verify: `rg -n "300" <file>` is empty.
- [x] 2.4 `src/features/onboarding/ui/welcome-controls.tsx`: `styles.topBar` drops `height: 60` and
      sets `minHeight: MinTouchTarget + Spacing.three` (D2); `styles.footer` drops `minHeight: 64`.
      Buttons, testIDs, labels and `styles.cta` unchanged. Verify: `rg -n "\b(60|64)\b" <file>` is
      empty.
- [x] 2.5 Comments (D6): rewrite `connect-screen.tsx:16-33,39-42` and `manual-import-screen.tsx:14-24`
      to the non-obvious why only (safe-URL gate for a server-owned string; unlisted institution has
      no trusted URL; Continue pushes the export guide, the assistant insertion point; manual import
      only orchestrates the two routes that own permission, validation and failure). Drop ticket
      ids, design ids and history. Fix `src/app/onboarding/index.tsx:1-4`, `connect.tsx:1-2` and
      `import.tsx:1-2` to one present-tense line each, with connect's Continue target as
      `/onboarding/export-guide/0`. Do not touch the `stepStyles` comment. Verify:
      `rg -n "TIM-|now |until now|finally|onboarding/import is" src/app/onboarding/{index,connect,import}.tsx src/features/onboarding/ui/{connect,manual-import}-screen.tsx`
      is empty.
- [x] 2.6 Update `src/features/onboarding/ui/welcome-screen.test.tsx`: in "settles Reanimated
      entrance and indicator styles" assert `withTiming(1, { duration: Motion.base })` and
      `withTiming(24, { duration: Motion.fast })` and advance timers by those tokens (import from
      `@/theme`). Add assertions: the body copy of each page resolves to `Colors.light.textSecondary`;
      the Skip bar's lane container (`StyleSheet.flatten` of the `onboarding-skip` button's
      container style; add no testID unless the tree cannot be reached otherwise, and then a new
      `onboarding-top-bar` testID only) has `minHeight` `MinTouchTarget + Spacing.three` and no
      `height`; the indicator has `minHeight` `MinTouchTarget`. Do not add a mid-file
      `jest.useFakeTimers()` beyond the ones already present. Verify:
      `npx jest src/features/onboarding` passes, and the contract from 1.1 now passes.
- [x] 2.7 Selectors: `rg -n "onboarding-" e2e .maestro 2>/dev/null` and `npx jest e2e/maestro-selectors`.
      Verify: no selector changed (expected: none to update); if one did, update the flow under
      `mobile/e2e` in this commit.

- [x] 2.8 AX5 clipping (D8): cold-launch the welcome screen on the iOS simulator at
      `accessibility-extra-extra-extra-large` and confirm every title, body, Skip, Next and the final
      CTA wraps unclipped; reproduce the runtime size-change case and file it in the migration
      inbox. In `welcome-screen.test.tsx` assert no welcome label sets a cap of one or two lines or
      `adjustsFontSizeToFit`. Verify: the test passes and the inbox note exists.

## 3. Architecture Book (D7) — commit 2

- [x] 3.1 `docs/mobile/architecture-book/features.md`, the `onboarding/index` bullet (~`:191`):
      state the current presentation: Skip, Next and the final CTA are `Button`s; the Skip bar is at
      least `MinTouchTarget + Spacing.three` and grows with Skip; the indicator reserves
      `MinTouchTarget`; the entrance fade and indicator transition use `Motion.base` / `Motion.fast`
      and snap under reduced motion; body copy uses the `secondary` tone. Current state only.
      Verify: the bullet names `welcome-screen.test.tsx` as its proof.
- [x] 3.2 `docs/mobile/architecture-book/lint-format.md`: add a "Migrated screens" entry after the
      style-literal ratchet (~`:501`): `src/design/screen-migration.contract.test.ts` lists each
      migrated file under its slice, the pattern set (design D4), comments excluded, grow-only,
      every Phase 5 slice appends its files in the same PR; the patterns no lint rule covers
      (`themeColor`, legacy type aliases, hand-rolled 44/48) are named; inject-and-revert proof
      (`themeColor="textSecondary"` in `welcome-pages.tsx` fails the test). Verify: the entry links
      the test file and ADR 077.
- [x] 3.3 `docs/mobile/architecture-book/decisions/077-visual-style-lint-ratchet.md`: extend
      Decision and Consequences with the migrated-screen contract (D7), current-state wording; edit
      the `decisions/README.md` row title only if it no longer describes the ADR. Verify:
      `rg -n "screen-migration.contract" docs/mobile/architecture-book/decisions/077-visual-style-lint-ratchet.md`
      hits.
- [x] 3.4 `docs/mobile/architecture-book/CHANGELOG.md`: add `## 2026-10-26 — Onboarding welcome,
      connect and manual import on the design system` above the newest entry: tone, touch-target and
      `Motion` tokens on the welcome screen, the growing Skip bar (Android 64 dp), the migrated-screen
      contract with links to `lint-format.md` and ADR 077, and no ratchet change. Verify: it is
      the first entry and dated 2026-10-26.
- [x] 3.5 `theming.md`: check whether any line describes the onboarding welcome controls in a way
      that is no longer true (`rg -n "onboarding|welcome" docs/mobile/architecture-book/theming.md`);
      fix only false statements. Verify: no stale onboarding statement remains.

## 4. Verification

- [x] 4.1 Scoped audit greps (task 0.2 command) over the twelve files. Verify: zero hits except
      style arrays composing animated/measured values and `Spacing.`/`Radii.` reference counts;
      paste the result in the PR body.
- [x] 4.2 `npx tsc --noEmit`. Verify: exits 0.
- [x] 4.3 `npm run lint`. Verify: zero errors and zero warnings.
- [x] 4.4 `npm test -- --coverage` (the CI form; plain `npm test` skips the gate). Verify: passes
      with every changed onboarding file at ≥ 90% branches and the 70% global floor.
- [x] 4.5 Inject-and-revert: add `themeColor="textSecondary"` back to `welcome-pages.tsx` and
      `const H = Platform.OS === "ios" ? 44 : 48` to `connect-screen.tsx`; run
      `npx jest src/design/screen-migration.contract` (fails naming both); revert. Verify: the
      failing output is in the PR body and the tree is clean after revert (`git diff --stat`
      shows no stray change).
- [x] 4.6 Disclosure scan, from the repo root after committing: `node ci/disclosure-scan.mjs`
      (derives identity patterns from commit authors and diffs against the merge base). Also read
      the diff of tests, specs and this change folder for any real person or account name. Verify:
      the scan exits 0 and the read finds none.
- [x] 4.7 `openspec validate ds-5-1-onboarding-screens` (repo root). Verify: valid.
- [x] 4.8 Device pass: iOS simulator (iPhone 17 Pro, iOS 26), welcome screen in light and dark at
      the default size and cold-launched at AX5: every label wraps, nothing clipped. Connect and
      manual import were not reachable (local schools API down; comment-only changes). Android and
      TalkBack: `docs/react-native-migration/inbox/2026-10-26-mobile-ds-5-1-onboarding-android-device-pass.md`.
