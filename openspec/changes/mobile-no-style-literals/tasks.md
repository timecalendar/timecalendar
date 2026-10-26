# Tasks

Run commands in `mobile/` unless a task says otherwise. Decisions D1 to D8 and the ADR outline
are in `design.md`. Use LSP `findReferences` before renaming or moving a symbol. Add no code
comment except a non-obvious why (the rule file's header rationale follows the sibling rules).
Docs describe the current state only. Tests, specs and the allowlist name no real person (the CI
disclosure scan rejects it); RuleTester fixtures use neutral names (`row`, `theme`, `item`).
Never build Android on the Mac. Land three commits, following the design's Migration Plan.

## 0. Baseline

- [x] 0.1 Re-check that 077 is the next free ADR number: from the repo root run
      `git fetch origin main && git ls-tree --name-only origin/main docs/mobile/architecture-book/decisions/ | tail -3`,
      read the reservation note in `decisions/README.md`, run `gh pr list --state open`, and for
      each open mobile PR `gh pr diff <N> --name-only | grep decisions/`. Verify: the number is
      written down for group 5 (077 unless taken; then the next free one, used everywhere 077
      appears below).
- [x] 0.2 Confirm the paging spike is gone: `rg -n "paging-spike" src` finds nothing. Verify: no
      output.

## 1. Rule and RuleTester suite (D1–D4, D8) — commit 1

- [x] 1.1 Create `tools/eslint-rules/no-style-literals.js`: header comment with the rationale and
      remaining blind spots (D8), linking lint-format.md → Style literals and ADR 077;
      `meta.schema` per D4 (one object, five booleans, `additionalProperties: false`), defaults
      `colors`/`shadows` true and `typography`/`spacing`/`radius` false; message ids
      `colorLiteral`, `typographyLiteral`, `legacyShadow`, `spacingLiteral`, `radiusLiteral`.
      Visitors: `Property` (non-computed, identifier or string key) and `JSXAttribute` (colors
      only, D2), key classification per the D2 table, value resolver per D3 (casts, conditional,
      logical, unary, literal-only binary, `Platform.select` object values, template literals),
      the CSS named-color set minus `transparent`, the `themeColor` name exclusion, and
      `shadowColor` reported once under `shadows`. Register it in `tools/eslint-rules/index.js`
      in alphabetical position. Verify: `node -e "require('./tools/eslint-rules').rules['no-style-literals']"`
      exits 0.
- [x] 1.2 Create `tools/eslint-rules/no-style-literals.test.js` (pattern:
      `no-raw-event-color.test.js`, `@typescript-eslint/parser`, JSX on). Run each case with all
      five options `true` unless the case pins an option. Cover at least:
      - valid: `theme.text`, `Spacing.two`, `Radii.medium`, `StyleSheet.hairlineWidth`,
        `borderColor: "transparent"`, `themeColor="textSecondary"`, `themeColor="red"`,
        `{ color: row.color }`, `padding: 0`, `gap: 1`, `borderRadius: 0`, `margin: "auto"`,
        `width: 12`, `top: 8`, `borderWidth: 2`, `letterSpacing: 0.15`, `[key]: "#fff"`,
        `color: PlatformColor("label")`, `boxShadow: theme.elevation`, `fontSize: 17` with
        `typography: false`, `padding: 12` with `spacing: false`, `borderRadius: 7` with
        `radius: false`, `color: "#fff"` with `colors: false`, `elevation: 2` with
        `shadows: false`; default options (no option object) leave `fontSize: 17`,
        `padding: 12` and `borderRadius: 7` valid.
      - invalid `colorLiteral`: `"#fff"`, `"#FFFFFFFF"`, `"rgb(0,0,0)"`, `"rgba(0, 0, 0, 0.4)"`,
        `"hsl(0 0% 0%)"`, `"White"`, `` `#${hex}` ``, `"#000" as ColorValue`,
        `cond ? "#000" : theme.text`, `x ?? "red"`, `Platform.select({ ios: "#000", default: theme.text })`,
        each per-side border color, `textDecorationColor`, JSX `color="white"`,
        `tintColor="#000"`, `placeholderTextColor="#999"`, `trackColor={{ true: "#0f0" }}`, a
        `"color"` string key, inside `StyleSheet.create`, inside a style array and in an
        inline `style={{…}}`.
      - invalid `typographyLiteral`: `fontSize: 17`, `lineHeight: 22`, `fontWeight: 600`,
        `fontWeight: "600"`, `fontWeight: "bold"`, `fontSize: large ? 20 : 17`.
      - invalid `legacyShadow`: `shadowColor: theme.text` (once, no `colorLiteral`),
        `shadowOffset: { width: 0, height: 2 }`, `shadowOpacity: 0.2`, `shadowRadius: 4`,
        `elevation: 2`, `elevation: level`, `boxShadow: "0 2px 6px rgba(0,0,0,0.16)"`.
      - invalid `spacingLiteral`: `padding: 12`, `paddingHorizontal: 12`, `marginStart: -4`,
        `paddingBlockEnd: 8`, `gap: isWide ? 16 : 8` (two reports), `rowGap: 4 * 2`,
        `padding: 12 as number`, `padding: Platform.select({ ios: 12, default: 16 })`,
        `margin: -1`.
      - invalid `radiusLiteral`: `borderRadius: 7`, `borderTopLeftRadius: 2`,
        `borderBottomEndRadius: 2`, `borderRadius: 9999`.
      Verify: `npx jest tools/eslint-rules/no-style-literals` passes, and
      `npx jest tools/eslint-rules/no-style-literals --coverage --collectCoverageFrom='tools/eslint-rules/no-style-literals.js'`
      shows at least 90% branches.
- [x] 1.3 Commit 1. Verify: `npx jest tools/eslint-rules` and `npm run lint` pass (the rule is
      registered but not yet wired, so lint is unchanged).

## 2. Design-layer fixes, config wiring and the ratchet (D5–D7) — commit 2

- [x] 2.1 Tokens (D7): in `src/theme/tokens.ts` add the iOS icon-tile corner radius (7) next to
      `ListGeometry.ios.leadingIconTile`, and the native list header icon size (88) and its iOS
      corner radius (20). Point `src/design/list/list-row.tsx` `iconTile` and
      `src/components/chrome/native-list-header.tsx` (`ICON_SIZE`, `iosIcon`) at them. Values are
      unchanged. Verify: `npx tsc --noEmit` passes and `npx jest src/theme src/design/list src/components/chrome/native-list-header`
      passes unedited.
- [x] 2.2 `src/design/status/error-surfaces.tsx`: the `ErrorMessage` title uses
      `ThemedText type="sectionTitle"`, keeps `accessibilityRole="header"` and
      `marginBottom: Spacing.two`, and drops the literal type keys. Update any assertion in
      `error-surfaces.test.tsx` that pinned the old size to the ramp's iOS and Android values.
      Verify: `npx jest src/design/status` passes on both platforms with ≥ 90% branches on the
      file (`--coverage --collectCoverageFrom='src/design/status/error-surfaces.tsx'`).
- [x] 2.3 `src/design/badge/badge.gallery.tsx:65`: move `"#E91E63"` into a module-level sample
      event-color constant used by the `EventSurface` there. Verify:
      `npx jest src/design/badge src/design/gallery` passes.
- [x] 2.4 Wire the rule in `eslint.config.js` (D5, D6), after `timecalendar/raw-text-input`:
      a `timecalendar/style-literals` block (`files: ["src/**/*.{ts,tsx}"]`, ignores
      `generatedCode`, `src/theme/**`, `src/features/personal-events/ui/color-swatch-presets.ts`,
      `src/test-support/**`, `**/*.test.{ts,tsx}`; all five options `true`); a
      `timecalendar/style-literals-chrome` block for `src/components/chrome/**` with the same
      ignores and `typography: false`; then one `timecalendar/style-literals-allowlist` block per
      `styleLiteralAllowlist` entry, built by a `map`, whose options start from the base or chrome
      options for that path and set the listed categories to `false`. Each block has a short
      comment naming ADR 077, matching the sibling blocks. Add the new block names to the list at
      the top of lint-format.md in group 5. Verify: `npx eslint --print-config src/components/chrome/native-list-header.tsx`
      shows `typography: false` and the other four `true`.
- [x] 2.5 Generate the allowlist (D6). With the allowlist empty, run
      `npx eslint --no-cache --format json src > /tmp/style-literals.json` (exit non-zero is
      expected) and reduce it with a one-off `node -e` to the distinct
      `local/no-style-literals` message ids per relative path. Write
      `tools/eslint-rules/style-literal-allowlist.js` exporting `styleLiteralAllowlist`
      (`{ path, categories }`, sorted by path, categories sorted) with a header comment like
      `raw-event-color-allowlist.js:1-4` and a trailing comment per entry naming the migrating
      slice from `docs/mobile/design-system-audit/migration-roadmap.md` (expected per the census:
      Home files 5.9, calendar screen files and `owned-calendar-chooser.tsx` 5.10, renderer
      header/page 5.11, `changelog-content.tsx` 5.4, `checklist-progress-indicator.tsx` 5.8,
      `school-logo.tsx` 5.5). A hit in `src/design/**` or `src/components/chrome/**` is fixed per
      D7 instead, or listed with a comment saying why no token fits. Record the command for the
      PR body. Verify: `npm run lint` passes with zero warnings, and
      `rg -n "src/design/" tools/eslint-rules/style-literal-allowlist.js` shows only entries
      with a reason comment (ideally none).
- [x] 2.6 Create `tools/eslint-rules/style-literal-allowlist.test.js` (pattern:
      `raw-event-color-allowlist.test.js`): a committed
      `STYLE_LITERAL_ALLOWLIST_CEILING` object keyed by the five message ids, set to the
      generated per-category counts (with the comment "Raising this needs a reason in review: the
      allowlist only shrinks."); one `ESLint` instance with the rule on and all five options
      `true`. Tests: per-category count ≤ ceiling; each path listed once; each path exists; each
      category is one of the five ids; every listed category still has a message of that id in
      that file (the failure lists `path:category`). Verify:
      `npx jest tools/eslint-rules/style-literal-allowlist` passes.
- [x] 2.7 Inject-and-revert proof (record the output for the PR):
      (a) add `color: "#333"` to a style in `src/features/feedback/ui/feedback-screen.tsx`:
      `npm run lint` fails with `local/no-style-literals` `colorLiteral`;
      (b) add `paddingTop: 12` there: lint fails with `spacingLiteral`;
      (c) add `shadowOpacity: 0.2` to a style in `src/design/list/list-row.tsx`: lint fails with
      `legacyShadow`;
      (d) add `fontSize: 17` to `native-list-header.tsx`: lint passes (chrome), and
      `borderRadius: 6` there fails with `radiusLiteral`;
      (e) in an allowlisted file listed without `colors`, add `color: "#333"`: lint fails
      (per-category composition);
      (f) add `{ path: "src/features/feedback/ui/feedback-screen.tsx", categories: ["spacingLiteral"] }`
      to the allowlist: the allowlist test fails (stale and over the ceiling);
      (g) remove one category from a listed entry whose file still violates it: `npm run lint`
      fails on that file.
      Revert all. Verify: `git status` shows no change in those files afterwards.
- [x] 2.8 Commit 2. Verify: `npx tsc --noEmit`, `npm run lint` and
      `npx jest tools/eslint-rules src/design src/theme src/components/chrome` pass.

## 3. CI proof — commit 2

- [ ] 3.1 The rule adds no runtime behavior; its CI proof is the Jest suites gated by
      `test-mobile` (`no-style-literals.test.js`, `style-literal-allowlist.test.js`) and the
      `lint-mobile` job running `npm run lint` through the wired blocks. Verify: after push, the
      PR's mobile jobs in `.github/workflows/ci-mobile.yml` are green and the `test-mobile` log
      lists both test files.

## 4. Verification

- [x] 4.1 `npx tsc --noEmit` passes.
- [x] 4.2 `npm run lint` passes with zero warnings.
- [x] 4.3 `npm test -- --coverage` passes, including the 90% per-file branch tiers, the gallery
      registry matrix with an unchanged known-violation list, `tools/eslint-rules`, the design
      import-policy and import-graph contracts and FR/EN parity. Record suite and test counts for
      the PR.
- [x] 4.4 From the repo root, `openspec validate mobile-no-style-literals` passes. Grep the change
      folder, the new rule, tests and allowlist for developer or account names. Verify: none
      found.
- [ ] 4.5 iOS simulator check (run by the conductor): open
      `timecalendar-dev://developer/gallery` and the status-view and list-row stories in light and
      dark; the error title sits on the `sectionTitle` step, the list icon tiles and the native
      list header icon keep their corners. Verify: screenshots recorded for the PR. No Android
      build on the Mac.

## 5. Architecture Book, ADR and docs (`docs/mobile/architecture-book/`) — commit 3

- [x] 5.1 Create `decisions/077-visual-style-lint-ratchet.md` from `TEMPLATE.md` (number from
      0.1), status Accepted, from design.md → Decision: Context (tokens and ramp exist, screens
      still write literals, Phase 5 needs a measurable exit), Decision, Rejected, Consequences,
      Revisit if. Add the index row to `decisions/README.md`. Verify: from the repo root,
      `rg -n "077" docs/mobile/architecture-book` shows the index row and every link.
- [x] 5.2 `lint-format.md`: add the three block names to the list at the top, and a
      **Style literals — `local/no-style-literals`** entry in the rule inventory: the five
      categories and their keys (D2), what counts as a literal (D3), the options (D4), scope and
      exemptions (D5, chrome typography off, renderer in scope), the per-file per-category
      allowlist and its blocks (D6), the ceiling test's failure modes, the caveats (D8), and the
      2.7 inject-and-revert proof. State as a standing rule: **every migration slice deletes its
      files, or the categories it cleans, from `style-literal-allowlist.js` in the same PR, and
      lowers the matching ceilings.** Verify:
      `rg -n "no-style-literals|same PR|style-literal-allowlist" docs/mobile/architecture-book/lint-format.md`
      shows each.
- [x] 5.3 `theming.md` → Token layer: one bullet saying color, type, shadow, spacing and radius
      values come from `src/theme/` and the ramp, enforced by `local/no-style-literals`
      ([lint-format.md](./lint-format.md) → Style literals, ADR 077), and naming the new
      `ListGeometry` icon tokens. Verify: `rg -n "no-style-literals" docs/mobile/architecture-book/theming.md`
      matches.
- [x] 5.4 `CHANGELOG.md`: add `## 2026-10-26 — Visual-style lint ratchet` at the top with bullets
      for the rule and its categories (lint-format.md, ADR 077), the per-category allowlist and
      the same-PR deletion rule (lint-format.md), the design-layer fixes and icon tokens
      (theming.md). Leave earlier entries as they are. Verify: the entry is first and every link
      resolves.
- [x] 5.5 `docs/mobile/design-system-audit/migration-roadmap.md`: mark 4.1 done only if earlier
      slices are marked there (follow the file's convention). Verify: the file's convention is
      respected (no change if it does not track status).
- [x] 5.6 Commit 3. Verify: `npm run lint` and `npm test -- --coverage` still pass and
      `openspec validate mobile-no-style-literals` passes.
