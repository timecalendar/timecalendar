# Tasks

All commands run in `mobile/` unless stated. One commit for §1–§4 (`feat(mobile): platform
type ramp and ThemedText tone`), one for §5 docs, or a single commit if preferred. Do not
migrate any call site to a new variant name or to `tone` (phase 5). Do not touch
`src/features/calendar/renderer/**`.

## 1. Ramp in the theme layer (design D1)

- [x] 1.1 Create `src/theme/typography.ts`: the `TypeVariant` union (11 members, D1 order), the
      `TypeStep` type (`style` limited to `fontSize`/`lineHeight`/`fontWeight`/`letterSpacing`,
      optional `dynamicTypeRamp` typed from RN's `TextProps["dynamicTypeRamp"]`), private
      `iosRamp` and `androidRamp` records each `satisfies Record<TypeVariant, TypeStep>` with the
      exact D1 values (iOS: no `letterSpacing`, `dynamicTypeRamp` on every step except
      `caption`/`captionSmall`; Android: M3 `letterSpacing`, no `dynamicTypeRamp`;
      `caption` 12/14/600 and `captionSmall` 11/13/400 on both), and
      `export const TypeRamp = Platform.select({ ios: iosRamp, default: androidRamp })` typed
      `Readonly<Record<TypeVariant, TypeStep>>`. Numeric `fontWeight` (matches today's style).
      Comments only for the non-obvious why (no iOS tracking because SF tracks optically; no
      Dynamic Type ramp on dense tiles because of the renderer's caps).
- [x] 1.2 `src/theme/index.ts`: export `TypeRamp` and the `TypeStep` / `TypeVariant` types
      (sorted; `simple-import-sort/exports` passes). Verify: `npx tsc --noEmit` clean.
- [x] 1.3 Create `src/theme/typography.test.ts` (design D7): for `ios` and `android`, load
      `@/theme/typography` inside `jest.isolateModules` with
      `jest.doMock("react-native/Libraries/Utilities/Platform", …)` and `jest.dontMock` in
      `finally` (copy the `MinTouchTarget` case in `theme.test.tsx`). Assert `TypeRamp` `toEqual`s
      a literal expected table per platform (the D1 numbers written out in the test). Assert
      `lineHeight >= fontSize` per step, no Android `dynamicTypeRamp`, no iOS `letterSpacing`,
      equal `caption`/`captionSmall` across platforms, and that `Platform.OS` is `ios` again after
      the isolated loads. Verify:
      `npx jest src/theme --coverage --collectCoverageFrom='src/theme/**'` passes and
      `typography.ts` has 100% line and branch coverage.

## 2. `ThemedText` renders the ramp (design D2, D3, D5)

- [x] 2.1 `src/components/themed-text.tsx`: export `ThemedTextType` (`TypeVariant` plus
      `"default" | "small" | "smallBold" | "subtitle"`) and `TextTone`
      (`"primary" | "secondary" | "action" | "destructive" | "onPrimary"`, JSDoc stating
      `primary` is the primary label color, not brand pink, and that brand text is `action`).
      Add the private `legacyTypeAliases` record (D2), the exhaustive
      `headingRole: Record<TypeVariant, boolean>` (D3: true for `largeTitle`, `title`, `title2`,
      `sectionTitle` only) and `toneColor: Record<TextTone, ThemeColor>` (D5).
- [x] 2.2 Make `ThemedTextProps = TextProps & { type?: ThemedTextType } & ColorProps` with the
      D5 mutually exclusive `tone` / `themeColor` union. Default `type` is `"body"`. Resolve the
      step once; render `accessibilityRole={headingRole[step] ? "header" : undefined}`,
      `dynamicTypeRamp={TypeRamp[step].dynamicTypeRamp}`, and
      `style={[{ color: theme[themeColor ?? toneColor[tone ?? "primary"]] }, TypeRamp[step].style, style]}`,
      with `{...rest}` spread last so caller `accessibilityRole` / `dynamicTypeRamp` win. Delete
      the local `StyleSheet`. Verify: `npx tsc --noEmit` clean with zero call-site edits (every
      existing `type` and `themeColor` usage still compiles).
- [x] 2.3 Rewrite `src/components/themed-text.test.tsx` (design D7). Keep the harness smoke
      test. Add a typed `Record<ThemedTextType, { step: TypeVariant; heading: boolean }>`
      expectations table (all 15 accepted types) driving `it.each`: header role present iff
      `heading`; `StyleSheet.flatten(style)` `toMatchObject(TypeRamp[step].style)`;
      `props.dynamicTypeRamp` equals `TypeRamp[step].dynamicTypeRamp`. Add: no `type` renders
      the `body` step with no header role; each tone renders its `Colors.light` token; one tone
      under a mocked dark scheme renders its `Colors.dark` token (`jest.mock("@/hooks/use-color-scheme", …)`);
      `themeColor="textSecondary"` still resolves; caller `style` (`{ fontSize: 30 }`) wins;
      caller `accessibilityRole="summary"` wins over the header default; caller
      `dynamicTypeRamp="caption2"` wins. Add type-level probes, each on its own line with
      `// @ts-expect-error`: `tone="brand"`, `tone="tertiary"`, `type="huge"`, and
      `tone="secondary"` together with `themeColor="text"`. Verify: the file passes, and removing
      one `@ts-expect-error` makes `npx tsc --noEmit` fail (revert).
- [x] 2.4 Inject-and-revert check for D3 (not committed): add a member to `TypeVariant` in
      `typography.ts` without touching `themed-text.tsx` → `npx tsc --noEmit` fails on
      `headingRole` (and on both platform records). Revert. Note the result in the PR body.

## 3. Pinned tests follow the ramp (design D6, D7)

- [x] 3.1 `src/features/home/ui/home-screen.test.tsx:167,170`: replace the
      `{ fontSize: 32, lineHeight: 44, fontWeight: 600 }` literals with
      `TypeRamp.sectionTitle.style` (import from `@/theme`). Verify: the file passes.
- [x] 3.2 `src/theme/brand-small-text.test.ts`: the type matcher accepts `smallBold` or `label`
      (`/\btype=\{?\s*["'](smallBold|label)["']/`); rename the describe/its text to "brand-colored
      label text". Add a `type="label" themeColor="primary"` element to the detector fixture and
      bump the expected count. Verify: the file passes.
- [x] 3.3 Run the whole suite once (`npm test`) and fix any other test that pinned a
      pre-ramp `ThemedText` size or weight by asserting the `TypeRamp` step, never a new literal.
      Do not change production call sites to make a test pass.

## 4. Verify (DoD)

- [x] 4.1 `npx tsc --noEmit` clean.
- [x] 4.2 `npm run lint` (`--max-warnings 0`) clean.
- [x] 4.3 `TZ=UTC npm test -- --coverage` green, including the 90% per-file branch gate for
      `src/theme/**`.
- [x] 4.4 `npm run react-doctor:changed` reports no new findings.
- [ ] 4.5 `openspec validate mobile-type-ramp` passes (repo root). CI `test-mobile` is green on
      the PR; the PR body carries the D4 device-check table so the device pass knows which
      screens to inspect.

## 5. Architecture Book (current state only, no history narration)

- [x] 5.1 Create `docs/mobile/architecture-book/decisions/063-platform-type-ramp.md` from
      `TEMPLATE.md` (design D8): Status Accepted; Context (no ramp in the token layer, headings
      far above platform sizes, phase 3 primitives need typography tokens); Decision (ramp in
      `src/theme/typography.ts` exported from `@/theme`, iOS HIG + `dynamicTypeRamp`, Android M3
      + tracking, dense calendar steps platform-independent, heading role per step in an
      exhaustive record, closed `tone` without brand or tertiary, aliases and `themeColor` until
      phase 4.3; alternatives rejected: one cross-platform ramp, `subtitle → title2`, `variant`
      rename now, a `tertiary` tone on the decorative token); Consequences (every text style
      changes; device pass at default and AX5 is the acceptance; a rejected size is a one-row
      change); Revisit if (device or accessibility-workstream review rejects a step; RN/Expo
      ships platform text styles; a custom font family is adopted). Keep it short.
- [x] 5.2 `docs/mobile/architecture-book/decisions/README.md`: add the
      `[063](./063-platform-type-ramp.md)` row to "Active decisions" ("Resolve the type ramp per
      platform in the theme layer"), keeping the table aligned (Prettier).
- [x] 5.3 `docs/mobile/architecture-book/accessibility.md` "The heading-role contract": state
      that `largeTitle`, `title`, `title2`, `sectionTitle` (and the `subtitle` alias) map to
      `accessibilityRole="header"`, that `headline` and every body/label/footnote/caption step
      and the other aliases carry no role, that the role per step is an exhaustive typed record
      (a new variant without a role is a `tsc` error), caller role still wins. Replace the
      "Body/default/small/link/code variants" wording. Under font scaling, add that iOS ramp steps
      scale on Apple's Dynamic Type curve through `dynamicTypeRamp` (caption steps scale
      linearly under their caps). Update "Proof in CI" to the per-variant `it.each` table in
      `themed-text.test.tsx` and the ramp values in `typography.test.ts`. Link ADR 063.
- [x] 5.4 `docs/mobile/architecture-book/theming.md` "Token layer": add a type-ramp bullet
      (`src/theme/typography.ts`, the 11 `TypeVariant` steps, `Platform.select` at module load,
      iOS HIG + `dynamicTypeRamp`, Android M3 + tracking, dense calendar steps shared, both
      platform records `satisfies` the full union, link ADR 063). Add `TypeRamp` /
      `TypeVariant` / `TypeStep` to the `index.ts` public-surface list. Rewrite the `Themed*`
      bullet: `ThemedText` renders `TypeRamp` steps through `type` (aliases `default`/`small`/
      `smallBold`/`subtitle` listed with their steps), colors through `tone`
      (`primary`/`secondary`/`action`/`destructive`/`onPrimary`, no brand member; exclusive with
      `themeColor`), heading role per accessibility.md. In the brand bullet, the
      brand-small-text scan covers `type="smallBold"` and `type="label"`, and brand-colored text
      is `tone="action"`.
- [x] 5.5 `docs/mobile/architecture-book/CHANGELOG.md`: add a newest-first
      `## 2026-10-25 — Platform type ramp and ThemedText tone` entry above the existing
      2026-10-25 tokens entry: the ramp and its export, the alias mapping, `tone`, the heading
      steps, the extended brand-text scan, ADR 063, and the touched files
      (`accessibility.md`, `theming.md`, `decisions/README.md`).
- [x] 5.6 Leave `docs/mobile/design-system-audit/**` unchanged (exploration, not rules).
- [x] 5.7 Re-run `npx prettier --check` on the touched Markdown (repo lint-staged formats docs)
      and `openspec validate mobile-type-ramp`.
