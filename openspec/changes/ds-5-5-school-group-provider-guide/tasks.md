# Tasks

Run commands in `mobile/` unless a task says otherwise. Decisions D1 to D8 are in `design.md`. Use
LSP `findReferences` before removing or renaming a symbol (`PageIntro`, `SchoolLogo`, `LogoSize`,
`EXPORT_GUIDE_ASSET_ORIGINS`, `DisclosureChevron`). Add no code comment except a non-obvious why.
Docs describe the current state only (no "now", "previously", "changed from"). Tests, specs and
docs name no real person or account. Never build Android on the Mac.

**Do not touch slice 5.4 files** (a parallel change owns them): `src/features/activity/**`,
`src/features/changelog/**`, `src/app/activity.tsx`, the changelog routes and sheet, and their rows
in `style-literal-allowlist.js` / `ad-hoc-status-allowlist.js`. On rebase, resolve
`MIGRATED_FILE_FLOOR`, the ADR number and the `CHANGELOG.md` head by union.

## 0. Baseline

- [x] 0.1 Ratchet census: `rg -n "school-selection|export-guides|app/onboarding/(school|groups|export-guide)" tools/eslint-rules/*-allowlist.js`.
      Verify: exactly `raw-button-allowlist.js` (group picker) and `style-literal-allowlist.js`
      (`school-logo.tsx`, `typographyLiteral`), as in design → Context. If more appear, include them
      in group 4 with the matching ceiling.
- [x] 0.2 Drift census: run the contract's `DRIFT_PATTERNS` over the design D7 file list plus
      `school-logo.tsx` (a throwaway `node -e` that evals the array out of
      `src/design/screen-migration.contract.test.ts`; do not commit it). Verify: hits match design
      → Context's table.
- [x] 0.3 `rg -n "PageIntro" src -g '!*.test.*' | rg -n "title="` and
      `rg -n "introTitle|exportGuide\.provider\.title" src`. Verify: only
      `provider-selection-screen.tsx` and the two gallery files pass `title`; record the key users.

## 1. Design layer (D1, D2, D4) — commit 1

- [x] 1.1 Add `ThumbnailSize = { medium: 40, large: 56 }` to `src/theme/tokens.ts` and export it from
      `@/theme`. Verify: `npx tsc --noEmit` passes.
- [x] 1.2 Create `src/design/thumbnail/thumbnail.tsx` per design D1 (props `source`, `size`,
      `monogram`, `onError`, `testID`; scheme via `useColorScheme`; chip on `logoSurface` with
      `Radii.medium`, 1-pt overshoot image, overlaid `separator` hairline ring; monogram on
      `primarySoft` in `onPrimarySoft`, `type="headline"`, `allowFontScaling={false}`; failed URI
      kept in state and compared to the resolved URI; root hidden from assistive technology). Export
      `Thumbnail` and `ThumbnailProps` from `src/design/index.ts`. Verify: `npx tsc --noEmit`;
      `npm run lint` clean for `src/design/thumbnail`.
- [x] 1.3 `src/design/thumbnail/thumbnail.test.tsx`: light URL in light scheme, dark URL in dark
      scheme, light fallback in dark when no dark URL, monogram when no URL, monogram plus one
      `onError` call after the image `error` event, retry after a scheme switch, fixed width/height
      at `fontScale` 3, and the tile absent from the accessibility tree (query with and without
      `includeHiddenElements`). Verify: `npx jest src/design/thumbnail` passes at 100% branches.
- [x] 1.4 `src/design/thumbnail/thumbnail.gallery.tsx` (+ `.gallery.test.tsx`) with `image`,
      `dark-image`, `monogram`, `sizes` stories, registered in `src/design/gallery/registry.ts`;
      use a local static asset or a fixture URL the gallery tests already use (no network in tests).
      Verify: `npx jest src/design/thumbnail src/design/gallery src/features/developer` passes.
- [x] 1.5 Add `expand_more` and `expand_less` to `src/design/icon/icon-glyphs.ts`; add their pins to
      `icon.test.tsx` the way the existing glyphs are pinned. Verify: `npx jest src/design/icon`
      passes (the test checks the codepoints against the font table).
      Note: `icon.test.tsx` already loops every glyph against the Material map, so it pins both.
- [x] 1.6 `src/design/list/list-row.tsx`: make `ListRowAction` the exclusive union of design D2;
      generalize `DisclosureChevron` to take its glyph; an `expanded` row renders it on both
      platforms with testID `${testID}-disclosure` and sets `accessibilityState` `{ expanded,
      disabled }` with no `selected`. Verify: `npx tsc --noEmit` passes; existing
      `list-row.test.tsx` passes unchanged.
- [x] 1.7 `list-row.test.tsx`: collapsed and expanded rows on iOS and Android (glyph name and
      `expanded` state), no `selected` state on a disclosure row, glyph hidden from assistive
      technology, and `// @ts-expect-error` lines for `expanded` + `selected` and `expanded` +
      `trailing="chevron"`. Add collapsed/expanded rows to the `states` story in
      `list-row.gallery.tsx`. Verify: `npx jest src/design/list` passes at ≥ 90% branches per file.
- [x] 1.8 `src/design/layout/root-page.tsx`: `PageIntroProps` = `{ caption: string; testID?; style? }`;
      render only the caption. Drop `title` from the fixtures in `root-page.gallery.tsx` and
      `keyboard-safe-action-layout.gallery.tsx`. Replace the "renders an optional heading" test in
      `root-page.test.tsx` with a `// @ts-expect-error` `title` call that asserts no `header` role
      renders. Delete `gallery.rootPage.introTitle` from `src/i18n/locales/{en,fr}.json` if 0.3
      found no other user. Verify: `npx tsc --noEmit`; `npx jest src/design/layout src/i18n`.

## 2. Screens (D3, D5, D6) — commit 2

- [x] 2.1 School picker: `school-row.tsx` leads with `<Thumbnail source={{ light: school.imageUrl,
      dark: school.imageUrlDark ?? undefined }} size="medium" monogram={school.name.trim().charAt(0).toUpperCase()}
      testID={`onboarding-school-logo-${school.id}`} />` with `width: ThumbnailSize.medium` and no
      `key`; `school-picker-screen.tsx` passes `ThumbnailSize.medium` to `ListRowSeparator`
      `leadingWidth`. Delete `school-logo.tsx`. Update `school-picker-screen.test.tsx` for the new
      monogram testID (`onboarding-school-logo-<id>-monogram`) only. Verify:
      `npx jest src/features/school-selection` passes; `rg -n "school-logo|LogoSize" src` is empty.
- [x] 2.2 Group picker per design D3: `GroupLevel` sections, leaves `selected`, branches
      `expanded` from a screen-level `Set`, child sections titled by the branch, Confirm as
      `Button variant="filled"` with `accessibilityLabel={t("onboarding.group.confirmLabel")}`; drop
      `Pressable`, `hitSlop`, `smallBold`, `useTheme`, `Radii`, and the `node`/`confirm`/`branch`/
      `children` styles. Rewrite the header comment (`:20-29`) to the non-obvious why only (the
      dismissal target, the empty-confirm guard). Verify: every behaviour test in
      `school-group-picker-screen.test.tsx` passes with the same testIDs and names; add assertions
      that a branch exposes `expanded` false then true and that an expanded branch's children sit
      under a section titled by the branch.
- [x] 2.3 Provider selection: `PageIntro caption={instructions}` only; thumbnail via
      `<Thumbnail source={{ light: thumbnail.url }} size="large" onError={...} testID={`export-guide-provider-${slug}-thumbnail`} />`
      keeping the failed-set state, the subtitle and the telemetry event; delete `THUMBNAIL` and
      `styles.thumbnail`. Delete `exportGuide.provider.title` from both locales. Verify:
      `npx jest src/features/export-guides` passes; add an assertion that provider selection
      renders no `header` role in content.
- [x] 2.4 Guide page per design D5: `Stack.Screen` title is `page.title` when a valid page renders,
      else `t("exportGuide.page.title")` (lift the options so the content branch sets them); remove
      the `type="title"` text; the `heading` ref View (rename `focusTarget`) is `accessible` with
      `accessibilityLabel={`${page.title}, ${progress}`}` and holds the progress `ThemedText
      tone="secondary" testID="export-guide-progress"`. Verify: in `guide-screens.test.tsx` the
      Stack options title equals the page title for pages 0 and 1, the loading/blocked states keep
      "Export timetable", `setAccessibilityFocus` is still called once per page, the focused node's
      label is "<title>, Page 1 of 2", and no `header` role renders in content.
- [x] 2.5 `export-guide-image.tsx`: both `themeColor="textSecondary"` → `tone="secondary"`. Verify:
      the image-failure test in `guide-screens.test.tsx` passes.
- [x] 2.6 Route comments: `src/app/onboarding/school.tsx` and `groups.tsx` to one present-tense line
      each (thin route; deep link). Verify: `rg -n "moved from|ship 2|TIM-" src/app/onboarding/{school,groups}.tsx`
      is empty.
- [x] 2.7 Selectors: `rg -n "export-guide-|onboarding-school|onboarding-group|onboarding-import-url" .maestro e2e`
      and `npx jest e2e/maestro-selectors`. Verify: no Maestro selector changed and the selector
      test passes.

## 3. Export-guide image origins (D8) — commit 2

- [x] 3.1 `src/features/export-guides/data/constants.ts`: `EXPORT_GUIDE_ASSET_ORIGINS` =
      dev, preprod (`https://timecalendar-preprod-public.fra1.digitaloceanspaces.com`) and
      production (`https://timecalendar-public.fra1.digitaloceanspaces.com`). Verify:
      `npx tsc --noEmit`.
- [x] 3.2 `parser.test.ts`: accept an image on each of the three origins; reject `http://` on the
      preprod host and a host that ends with `timecalendar-public.fra1.digitaloceanspaces.com` but
      differs (e.g. `evil-timecalendar-public…`); pin the set with `toEqual([...])`. Verify:
      `npx jest src/features/export-guides/data` passes.
- [x] 3.3 Repo root: `rg -n "timecalendar-dev-public" server/src/config` and
      `server/src/config/environments/test-env.test.ts`. Verify: the server test pins test ==
      development only; no server change is needed.
- [ ] 3.4 Enable the `export-guides-v1` flag and upload the guide assets on preprod/production, and
      confirm the bucket values (HUMAN: see inbox/2026-10-27-export-guide-preprod-flag-and-assets.md)

## 4. Ratchets and contract (D7) — commit 2

- [x] 4.1 Delete the group-picker row from `tools/eslint-rules/raw-button-allowlist.js` and set
      `RAW_BUTTON_ALLOWLIST_CEILING` to 4 in `raw-button-allowlist.test.js`. Verify:
      `npx jest tools/eslint-rules/raw-button-allowlist` passes.
- [x] 4.2 Delete the `school-logo.tsx` row from `tools/eslint-rules/style-literal-allowlist.js` and
      set `typographyLiteral` to 6 in `style-literal-allowlist.test.js`. Verify:
      `npx jest tools/eslint-rules/style-literal-allowlist` passes and `npm run lint` is clean.
- [x] 4.3 Append the slice `"5.5"` entry from design D7 to `MIGRATED_SCREENS` in
      `src/design/screen-migration.contract.test.ts` and set `MIGRATED_FILE_FLOOR` to 34 (or 34
      plus the 5.4 count if 5.4 merged first). Verify: `npx jest src/design/screen-migration.contract`
      passes.
- [x] 4.4 Inject-and-revert: add `type="smallBold"` to a `ThemedText` in
      `school-group-picker-screen.tsx`, re-add the group picker's row to `raw-button-allowlist.js`,
      and add `themeColor="textSecondary"` to `guide-page-screen.tsx`; run
      `npx jest src/design/screen-migration.contract tools/eslint-rules/raw-button-allowlist`
      (fails naming each); revert. Verify: the failing output is in the PR body and
      `git diff --stat` is empty for those files after revert.

## 5. Architecture Book — commit 3

- [x] 5.1 Write the ADR for `Thumbnail` (design D1) as the next free number in
      `docs/mobile/architecture-book/decisions/` from `TEMPLATE.md`, and add its row to
      `decisions/README.md`. Verify: the ADR links `src/design/thumbnail/thumbnail.tsx` and its
      test.
- [x] 5.2 `theming.md`: add `Thumbnail` to the primitive catalog (sizes, chip and ring, monogram
      colors, decorative, failure reset); in the Lists section (`:296` onward) add the `expanded`
      disclosure state and its glyphs; at `:521` state that `PageIntro` takes a caption only, by
      type. Verify: `rg -n "Thumbnail|expanded|caption only" docs/mobile/architecture-book/theming.md` hits each.
- [x] 5.3 `accessibility.md`: the guide-page focus target (progress caption named "<page title>,
      <progress>"; the native title is the page title) beside the native-title rule (`:198-200`),
      and the disclosure row's `expanded` state. Verify: both statements link their tests.
- [x] 5.4 `features.md`: the list-family bullet (`:170-176`) says the school picker leads with
      `Thumbnail` and the dormant group picker uses `ListSection`/`ListRow` with disclosure rows; the
      export-guides status bullet (`:153-157`) and the `export-guides` row (`:26`) name the page title
      in the native header and the three compiled image origins; add `thumbnail` to the gallery
      table (`:69` area) and `states` disclosure rows to `list-row`. Verify: no line still says the
      group picker "keeps its own tree rows".
- [x] 5.5 `lint-format.md`: raw-button ceiling and list text (`:323-331`), the style-literal
      allowlist text and the ring example that names the school logo (`:424-431`), and the
      migrated-screen entry (`:532` onward) naming slice 5.5. Verify:
      `rg -n "school-logo|school-group-picker" docs/mobile/architecture-book/lint-format.md` returns
      only current statements.
- [x] 5.6 `CHANGELOG.md`: add `## 2026-10-27 — School picker, group picker, provider selection and
      guide page on the design system` above the newest entry: `Thumbnail` (ADR link), `ListRow`
      disclosure, caption-only `PageIntro`, page title in the native header and the focus caption,
      the three image origins, the two allowlist rows and ceilings removed, the contract floor.
      Verify: it is the first entry and dated 2026-10-27.
- [x] 5.7 `docs/mobile/design-system-audit/migration-roadmap.md`: mark row 5.5 done the way 5.1 and
      5.3 are marked (check `git show 9a669152 -- docs/mobile/design-system-audit` for the
      convention; skip if neither marked the roadmap). Verify: consistent with 5.1/5.3.
      Note: skipped; neither 5.1 nor 5.3 touched the roadmap (its last change is #477).

## 6. Verification

- [x] 6.1 `npx tsc --noEmit`. Verify: exits 0.
- [x] 6.2 `npm run lint`. Verify: zero errors and zero warnings.
- [x] 6.3 `npm test -- --coverage` (the CI form; plain `npm test` skips the gate). Verify: passes,
      every changed or new file at ≥ 90% branches, global floor held.
- [x] 6.4 Scoped drift census (task 0.2 command) over the design D7 list. Verify: zero hits; paste
      in the PR body.
      Note: the 5.5 entries of `screen-migration.contract.test.ts` run the same patterns and pass.
- [x] 6.5 Disclosure scan from the repo root after committing: `node ci/disclosure-scan.mjs`; also
      read the diff of tests, specs, the inbox note and this change folder for real person or
      account names. Verify: the scan exits 0 and the read finds none.
- [x] 6.6 `openspec validate ds-5-5-school-group-provider-guide` (repo root). Verify: valid.
- [x] 6.7 iOS simulator pass (iPhone, iOS 26), light and dark, default text and AX5: school list
      (logos, monogram, separator inset), dev deep link `timecalendar-dev://onboarding/groups?schoolId=<id>`
      (expand, select, Confirm guard), provider selection (no in-body title), a guide page (title
      in the bar, progress caption, image or placeholder), and the blocked state against a local
      server with the flag off (Retry and Back). Verify: screenshots or notes in the PR body.
      Note: run against preprod. The group tree, provider selection content and guide content are
      unreachable there (no school groups, flag off); results and gaps are in
      inbox/2026-10-27-mobile-ds-5-5-device-pass.md.
- [ ] 6.8 Android device pass and VoiceOver/TalkBack pass (group disclosure announces expanded,
      guide focus reads "<title>, Page n of N", school row reads the name only) (HUMAN: see
      inbox/2026-10-27-mobile-ds-5-5-device-pass.md)
