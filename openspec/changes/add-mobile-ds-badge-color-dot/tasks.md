# Tasks

Run commands in `mobile/` unless a task says otherwise. Decisions D1 to D12 are in `design.md`.
Await every RNTL 14 helper, use `usePlatform` (`@/test-support/platform`) for platform branches,
and use no fake timers. Add no code comment except a non-obvious why. Docs describe the current
state only. Tests and specs name no real person (the CI disclosure scan rejects it). Never build
Android on the Mac. Land three commits, following the design's Migration Plan.

## 0. Baseline

- [x] 0.1 Record the selectors the change must keep:
      `grep -rhoE 'id: *"?[A-Za-z0-9_${}.-]+' .maestro | sort -u > /tmp/maestro-ids.before`, and
      `grep -rn "about-version\|checklist-progress-\|personal-event-row-" src --include=*.tsx -l > /tmp/badge-ids.before`.
      Re-check that 074 is the next free ADR number. From the repo root, run
      `git fetch origin main && git ls-tree --name-only origin/main docs/mobile/architecture-book/decisions/ | tail -3`,
      read the reservation note in `decisions/README.md`, and run `gh pr list --state open` then
      `gh pr diff <N> --name-only | grep decisions/` for each open mobile PR. Verify: both files
      are non-empty, and the chosen ADR number is written down for group 6.

## 1. Theme: `onPrimarySoft`, `ColorDotSize`, composited contrast (D5)

- [x] 1.1 `src/theme/tokens.ts`: add `onPrimarySoft` (light `#AD1457`, dark `#FF80AB`) next to
      `primarySoft`, and `export const ColorDotSize = { small: 8, medium: 12, large: 16 } as const`.
      In the contrast doc comment, add the BRAND WASH block with the computed ratios (light
      5.79 / 5.10 / 4.88, dark 8.11 / 5.90 / 5.89 over `background` / `backgroundElement` /
      `homeHero`) and `destructive` on `background` (6.54 / 12.37). Export `ColorDotSize` from
      `src/theme/index.ts`. Verify: `npx tsc --noEmit` passes.
- [x] 1.2 `src/theme/contrast.ts`: add `export function composite(fill: string, over: string): string`
      (an `#RRGGBBAA` or `#RRGGBB` fill over an opaque `#RRGGBB`, straight alpha, rounded channels,
      returns `#rrggbb`). Add `over?: ThemeColor` to `ContrastPair` and a 4-tuple `PairRow` form.
      Add an exported `pairRatio(pair)` that composites when `over` is set and otherwise calls
      `contrastRatio` (which still throws on an alpha hex). Add the rows to `bothSchemes`:
      `["onPrimarySoft", "primarySoft", "body", "background"]`, the same with `"backgroundElement"`
      and `"homeHero"`, and `["destructive", "background", "body"]`. Verify:
      `npx jest src/theme` passes with the new `describe.each` rows visible in `--verbose`.
- [x] 1.3 `src/theme/theme.test.tsx`: the `documentedContrastPairs` table uses `pairRatio`, and its
      title includes `over` when set. Add a `composite` block: an opaque fill returns itself, alpha
      `00` returns the surface, `#E91E631F` over `#ffffff` returns `#fce4ec`, and `pairRatio` on a
      translucent background with no `over` throws. Add the `onPrimarySoft` light/dark resolution
      and the `ColorDotSize` values. Update `tokens.gallery.tsx` so the contrast-pairs table
      draws the composited swatch and names `over`. Verify: `npx jest src/theme --coverage
      --collectCoverageFrom='src/theme/**'` passes with 90% branches on `contrast.ts`.

## 2. Primitives (D1–D4, D10, D11)

- [x] 2.1 `src/design/badge/badge.tsx`: export `Badge`, `BadgeProps`, `BadgeTone`, `BadgeSize`
      and `BadgeLayoutStyle`, following D1–D3 and the button family's layout-style type. Imports:
      `@/theme`, `@/design/text/themed-text` and `@/design/icon/icon` only, never chrome and never
      the barrel. `accessibilityLabel: string | null` is required. Verify: `npx tsc --noEmit`
      passes, and `npx eslint src/design/badge` is clean.
- [x] 2.2 `src/design/badge/badge.test.tsx` per D11: tone colors in both schemes (mock
      `@/hooks/use-color-scheme`), size → type and padding, icon `scaling: "text"` growth at
      `fontScale` 3 (mock `useWindowDimensions`), named (role `text`, the name, and the visible
      label not separately accessible) vs `null` (hidden), `numberOfLines` 2, style last, and
      sub-testIDs. Add `@ts-expect-error` cases for a missing `accessibilityLabel`, a `color` prop
      and a `fontSize` style key. Run on iOS and Android. Verify:
      `npx jest src/design/badge --coverage --collectCoverageFrom='src/design/badge/badge.tsx'`
      shows 100% branches.
- [x] 2.3 `src/design/color-dot/color-dot.tsx`: export `ColorDot`, `ColorDotProps`,
      `ColorDotSizeName`, `ColorDotRing` and `ColorDotLayoutStyle` per D4. It is always decorative,
      takes no label prop, and draws `color` verbatim. Add `color-dot.test.tsx`: size → `ColorDotSize`,
      `borderRadius: Radii.pill`, verbatim fill, each ring token per scheme with `borderWidth` 2,
      no border without `ring`, decorative props, style last, and `@ts-expect-error` on
      `accessibilityLabel` and `ringColor`. Verify: `npx jest src/design/color-dot --coverage
      --collectCoverageFrom='src/design/color-dot/color-dot.tsx'` shows 100% branches.
- [x] 2.4 Gallery fixtures per D10: `badge.gallery.tsx` (`id: "design-badge"`, stories `Tones`,
      `Sizes`, `WithIcon`, `Accessibility`, `LongStrings`) and `color-dot.gallery.tsx`
      (`id: "design-color-dot"`, stories `Sizes`, `Presets`, `Rings`, `Stack`). Each has a
      `*.gallery.test.tsx` that renders every story. Register both in `src/design/gallery/registry.ts`
      after `separator`. Add `gallery.badge.*` and `gallery.colorDot.*` keys to
      `src/i18n/locales/en.json` and `fr.json`. The `LongStrings` FR label is the longest string in
      either file for that story. Verify: `npx jest src/design/gallery src/design/badge
      src/design/color-dot src/i18n` passes (registry light/dark × iOS/Android, orphan and L10
      contract, FR/EN parity), and `git diff main -- src/design/gallery/known-a11y-violations.ts` is empty.
- [x] 2.5 Export `Badge`, `ColorDot` and their types from `src/design/index.ts`, in alphabetical
      position. Add `"src/design/badge/badge.tsx"` and `"src/design/color-dot/color-dot.tsx"` rows
      at `{ lines: 90, branches: 90 }` to `jest.config.js` `coverageThreshold`. Verify:
      `npx jest src/design/import-graph.contract src/design/gallery/fixture-coverage.contract`
      passes.

## 3. Lint: `local/no-raw-event-color` (D8)

- [x] 3.1 `tools/eslint-rules/no-raw-event-color.js` per D8, with the rationale header comment
      linking lint-format.md and ADR 074, in the style of `no-ad-hoc-separator.js`. Register it in
      `tools/eslint-rules/index.js`. Add `no-raw-event-color.test.js` (RuleTester): invalid
      `backgroundColor: event.color`, `backgroundColor: tag.color`, `backgroundColor: item?.color`
      and `borderColor: event.color`; valid `backgroundColor: theme.primary`, `backgroundColor: hex`,
      `backgroundColor: eventSurfaceColor(event.color, scheme)`, `color: row.color` and
      `[key]: event.color`. Verify: `npx jest tools/eslint-rules/no-raw-event-color` passes.
- [x] 3.2 `tools/eslint-rules/raw-event-color-allowlist.js`
      (`["src/features/calendar/ui/event-details-content.tsx", // 5.8 title dot and TagBubble]`,
      plus `RAW_EVENT_COLOR_ALLOWLIST_CEILING = 1`) and `raw-event-color-allowlist.test.js`
      (missing file, duplicate, ceiling, and a stale entry checked by linting each listed file with
      the rule). Mirror `ad-hoc-separator-allowlist.test.js`. Add the `timecalendar/raw-event-color`
      block to `eslint.config.js` after `timecalendar/ad-hoc-separator`, with
      `files: ["src/**/*.tsx"]` and ignores `src/design/**`, `src/theme/**`,
      `src/features/calendar/renderer/**`, `**/*.test.{ts,tsx}` and the allowlist. Verify:
      `npx jest tools/eslint-rules` passes. `npm run lint` fails only in `welcome-card.tsx` and
      `personal-events-list.tsx` until group 4 lands.

## 4. Call sites (D6, D7, D9)

- [x] 4.1 `src/components/chrome/native-list-header.tsx`: replace the caption `View` and
      `ThemedText` with `Badge` imported from `@/design/badge/badge`, using
      `tone="brand" size="small" label={caption} accessibilityLabel={caption}
      testID={captionTestID}` and a layout style `{ alignSelf: "center", marginTop: Spacing.one }`.
      Delete the `pill` and `caption` styles. Update `native-list-header.test.tsx`: the caption
      root has the `primarySoft` fill and the label is `onPrimarySoft` (dark), on iOS and Android.
      Check `features/about/ui/about-screen.test.tsx` still finds `about-version` and its text.
      Verify: `npx jest src/components/chrome/native-list-header src/features/about src/design/import-graph.contract`
      passes (no cycle), and `npm run test -- tools/eslint-rules/design-import-policy` passes.
- [x] 4.2 `src/features/event-checklists/ui/checklist-progress-indicator.tsx`: the `inline`
      variant returns the D6 `Badge`. The `compact` path keeps its current drawing and
      identifiers. Delete the styles only `inline` used. Update
      `checklist-progress-indicator.test.tsx`: inline is hidden, its outline and label are
      `informational` (partial) or `positive` (complete) with the matching glyph, its
      `checklist-progress-inline-label` text is `completed/total`, and compact assertions stay
      unchanged. Verify: `npx jest src/features/event-checklists src/features/home
      src/features/calendar/ui` passes; owner summaries still carry the progress phrase.
- [x] 4.3 `src/features/personal-events/ui/personal-events-list.tsx`: `leading` is
      `{ element: <ColorDot color={event.color} size="large" />, width: ColorDotSize.large }`.
      Delete the `SWATCH` constant and the `swatch` style. In `personal-events-list.test.tsx`,
      assert the row's dot fill equals the event color, the dot is hidden, and the row's accessible
      name is exactly the title. Verify: `npx jest src/features/personal-events` passes.
- [x] 4.4 `src/features/home/ui/home-screen/welcome-card.tsx`: render each dot as
      `<ColorDot color={event.color} size="medium" ring="homeHero" style={{ marginLeft: index === 0 ? 0 : -Spacing.one }} />`
      and delete the `dot` style. The `#FFFFFF` literal goes with it. Keep the hidden dots
      container, the `+N` text and the count. In `home-screen.test.tsx`, assert seven events render
      five dots with the `homeHero` ring and "+2", and the summary text is unchanged. Verify:
      `npx jest src/features/home` passes.
- [x] 4.5 Run `npm run lint`. Verify: it passes with zero warnings, and
      `grep -rnE "(backgroundColor|borderColor): *[A-Za-z_.?]+\.color\b" src --include=*.tsx | grep -v "\.test\."`
      lists only `event-details-content.tsx`.
- [x] 4.6 Inject-and-revert proof (record the output for the PR):
      (a) add `<View style={{ backgroundColor: event.color }} />` to
      `src/features/personal-events/ui/personal-events-list.tsx`, and `npm run lint` fails naming
      `local/no-raw-event-color`;
      (b) add `personal-events-list.tsx` to the allowlist, and the allowlist test fails (stale
      entry, over ceiling);
      (c) give a `Badge` in a fixture no `accessibilityLabel`, and `npx tsc --noEmit` fails.
      Revert all three. Verify: `git status` is clean for those files afterwards.
- [x] 4.7 Selector check. Re-run the 0.1 greps into `/tmp/*.after` and `diff` them. Verify: both
      diffs are empty, and `npx jest e2e/maestro-selectors` passes.

## 5. CI proof

- [ ] 5.1 The CI proof for the runtime behavior is the Jest suite gated by `test-mobile`:
      `badge.test.tsx` (tone tokens per scheme, the required accessibility choice, text scaling),
      `color-dot.test.tsx` (decorative, verbatim color, ring tokens), `theme.test.tsx` (the
      composited brand-wash pairs at 4.5:1), the registry matrix, and the lint rule plus allowlist
      suites. Verify: after push, the PR's `test-mobile` job (`.github/workflows/ci-mobile.yml`)
      is green and its log lists `badge.test.tsx`, `color-dot.test.tsx` and `no-raw-event-color.test.js`.

## 6. Architecture Book, ADR and docs (`docs/mobile/architecture-book/`)

- [ ] 6.1 Create `decisions/074-badge-and-color-dot.md` from `TEMPLATE.md` (use the number from
      0.1), with status Accepted.
      - Context: A14/A15 drift, the uncovered translucent brand pair (4.30:1), the `#FFFFFF` ring.
      - Decision: D1 (tone table), D2–D3 (size, scaling, required `accessibilityLabel: string | null`),
        D4 (decorative circular dot, surface-token ring, color names owned by the control), D5
        (`onPrimarySoft`, composited pairs), D6 (compact checklist stays), D7 (chrome imports
        `badge/` by path), D8 (`no-raw-event-color` ratchet, no shape rule).
      - Rejected: an `appearance` prop, all-outlined badges, single-line ellipsis, an optional
        label defaulting to the visible text, a `decorative` boolean, a dot label prop, a
        `ringColor` string, an opaque `brandContainer`, and a `Radii.pill` shape rule.
      - Consequences: the allowlisted event details file (5.8), the bespoke compact pill
        (3.9/5.11), and the inbox device pass.
      - Revisit if: `EventSurface` (3.9) absorbs the dot's data-color role; a status badge needs a
        soft fill; or the native seam's badge is replaced by `Badge`.

      Add the row to `decisions/README.md`. Verify: from the repo root,
      `rg -n "074" docs/mobile/architecture-book` shows the index row and every link.
- [ ] 6.2 `theming.md`: add `## Badges and color dots — Badge, ColorDot (src/design/badge/, src/design/color-dot/)`
      after the Lists section. Cover the tone table, sizes, scaling, the accessibility choice, the
      dot sizes and ring, "color names belong to the control", the gates (90% tiers,
      `local/no-raw-event-color`, gallery story ids) and the deferrals. In the color-role list, add
      `onPrimarySoft` and composited pairs (`over`). In "How event color appears outside the
      calendar", make item 1 (Dot) name `ColorDot`. In the `NativeListHeader` bullet, say the caption
      is a brand `Badge`. Verify: `rg -n "ColorDot|onPrimarySoft|no-raw-event-color" docs/mobile/architecture-book/theming.md`
      shows each.
- [ ] 6.3 `accessibility.md`: add `## Badges and dots — encoded in Badge and ColorDot` (the required
      name-or-hidden choice, counts read as phrases, the two-line wrap with no clip, dots always
      decorative, and spoken color names owned by the control such as the swatch picker's
      `SWATCH_NAME_KEYS`). Change the event-details dot bullet to say it is decorative and
      migrates in 5.8. Link the inbox note `2026-10-26-mobile-ds-badge-color-dot-device-pass.md`.
      Verify: the section exists and every link resolves.
- [ ] 6.4 `lint-format.md`: add `timecalendar/raw-event-color` to the block list, and a
      rule-inventory entry `**Event colors — local/no-raw-event-color**` after Lists. Cover the
      scope, ignores, allowlist and ceiling (1), the variable/call and JSX-prop caveats, the
      no-shape-rule rationale, and the 4.6 inject-and-revert proof. Verify:
      `rg -n "raw-event-color" docs/mobile/architecture-book/lint-format.md` shows both.
- [ ] 6.5 Update the rest:
      - `testing.md`: the 90% tiers for `badge.tsx` and `color-dot.tsx`, and composited contrast
        pairs in the theme test.
      - `features.md`: the gallery registry table gets `badge` and `color-dot` rows. Personal
        events (the list's `ColorDot`), Home (welcome dots), Event checklists (inline `Badge`,
        compact unchanged) and About (brand caption `Badge`).
      - `architecture.md`: add `badge/` and `color-dot/` to the design family list.

      Verify: `rg -n "Badge|ColorDot" docs/mobile/architecture-book/{testing,features,architecture}.md`
      covers each file.
- [ ] 6.6 `CHANGELOG.md`: add `## 2026-10-26 — Badge and ColorDot` at the top. Bullets:
      - `Badge` and `ColorDot` in `src/design/` (theming.md → Badges and color dots, ADR 074).
      - `onPrimarySoft` and composited contrast pairs (theming.md).
      - The badge accessibility choice and decorative dots (accessibility.md).
      - `local/no-raw-event-color` at ceiling 1 (lint-format.md).
      - The migrated sites (features.md).

      Leave earlier entries as they are. Verify: the entry is first and every link resolves.
- [ ] 6.7 Outside the Book: `docs/react-native-migration/inbox/2026-10-26-mobile-ds-badge-color-dot-device-pass.md`
      exists (written at planning). Update its story ids if any changed during implementation.
      Verify: every story id it names (`badge--accessibility`, `badge--long-strings`,
      `color-dot--rings`, `color-dot--stack`) is produced by `src/design/gallery/stories.ts`
      (`npx jest src/design/gallery/stories` passes, and a grep of each id matches).
- [ ] 6.8 Android TalkBack and rendering device pass (HUMAN: see inbox/2026-10-26-mobile-ds-badge-color-dot-device-pass.md).
      Skip and continue; this does not block the PR. The iOS simulator pass is run by the
      conductor.

## 7. Verification

- [ ] 7.1 `npx tsc --noEmit` passes.
- [ ] 7.2 `npm run lint` passes with `--max-warnings 0`.
- [ ] 7.3 `npm test -- --coverage` passes. That includes the 90% per-file tiers (`badge.tsx`,
      `color-dot.tsx`, `src/theme/**`), the registry matrix with an unchanged known-violation
      list, `tools/eslint-rules` (new suites), the design import-policy and import-graph
      contracts, FR/EN parity and `e2e/maestro-selectors.test.ts`. Record the suite and test
      counts for the PR.
- [ ] 7.4 From the repo root, `openspec validate add-mobile-ds-badge-color-dot` passes. Then grep
      the change folder, the new tests and the inbox note for developer or account names. Verify:
      the grep finds none.
