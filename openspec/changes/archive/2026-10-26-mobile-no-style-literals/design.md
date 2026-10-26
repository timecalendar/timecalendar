# Design

## Context

See proposal.md for the motivation. Current state relevant to the approach:

- The house pattern for a ratcheted local rule is one rule file, one RuleTester suite, one
  allowlist module and one allowlist test with a pinned ceiling
  (`mobile/tools/eslint-rules/no-raw-event-color.js`, `raw-event-color-allowlist.js:5`,
  `raw-event-color-allowlist.test.js:11` `RAW_EVENT_COLOR_ALLOWLIST_CEILING = 1`). Each rule is a
  context-free `Property` visitor keyed on the property name (`no-raw-event-color.js:75`,
  `no-ad-hoc-separator.js:51`) and documents "a value read through a variable is not followed".
  The allowlist test lints every entry through a real `ESLint` instance and fails on a stale
  entry (`raw-event-color-allowlist.test.js:52`).
- Config blocks spread the allowlist into `ignores` (`eslint.config.js:915-927`). That works for a
  one-category rule; this rule has five categories, and a file can be clean on some and not on
  others.
- Tokens: `Spacing` (2…64), `Radii` (4, 8, 16, 9999), `ListGeometry`, `Elevation.raised`
  (`boxShadow` strings), `Colors` (`src/theme/tokens.ts:3,209,222,244,281`). Ramp:
  `src/theme/typography.ts`, `TypeRamp`, `ThemedText type=`.
- The only data fallback color constant is `EventFallbackColor` in
  `src/theme/event-appearance.ts:3`, already under `src/theme/`. The swatch presets are
  `src/features/personal-events/ui/color-swatch-presets.ts`. The paging spike is deleted
  (archive `2026-10-25-remove-mobile-paging-spike`).
- `themeColor="textSecondary"` is a typed token-name prop used across features
  (`src/design/text/themed-text.tsx:3`); `transparent` appears as a color value in
  `design/field/text-field.tsx:178`, `design/field/field-box.ts:41`,
  `features/event-checklists/ui/event-checklist.tsx:154` and
  `features/personal-events/ui/color-swatch-picker.tsx:62`.
- Census at c42c999f (grep, before the rule's own run): no legacy shadow key outside
  `src/theme/`; one color literal in a style (`owned-calendar-chooser.tsx:68` scrim
  `rgba(0, 0, 0, 0.4)`); typography, spacing and radius literals in about a dozen files, three
  of them in the design layer or chrome (`design/status/error-surfaces.tsx:97-99`,
  `design/list/list-row.tsx:517`, `components/chrome/native-list-header.tsx:130,137-151`).

## Goals / Non-Goals

**Goals:**

- One rule, five independently switchable categories, one message id per category.
- A per-file, per-category ratchet that composes in flat config and only shrinks.
- `src/design/**` and `src/components/chrome/**` clean at merge, with no allowlist entry.

**Non-Goals:**

- Following a literal through a variable, an imported constant or a spread identifier.
- Width, height, position (`top`/`left`/…), `borderWidth`, `letterSpacing`, opacity and
  `textShadow*` offsets/radii. They are not in L5–L7; the drift audit tracks them.
- L2–L4 import bans (slice 4.2), deprecated `ThemedText` names (slice 4.3), screen migrations.

## Decisions

### D1. Match by key, everywhere; no style-context detection

The rule visits every non-computed `Property` (identifier or string key) and every
`JSXAttribute`, classifies the key, and checks the value. It does not try to decide whether an
object is "a style". Inline `style={{…}}`, `StyleSheet.create({…})`, `[a, cond && {…}]`,
`cond ? {…} : {…}` and objects returned from a `.ts` helper are all `ObjectExpression`s, so one
visitor covers them.

- Alternative: detect style context (`style`/`*Style` JSX attribute, `StyleSheet.create`
  argument) and walk only there. Rejected: misses `.ts` helpers (`design/field/field-box.ts`)
  and objects built before being passed, which is exactly where ad-hoc styles hide, and it costs
  a scope walker the siblings do not need.
- Cost: a non-style data object with a style-named key and a literal value is reported. The
  scope already excludes the places such data lives (tests, `src/test-support/**`, the swatch
  presets, theme). A data mapper writing `{ color: row.color }` passes because the value is not
  a literal.

**`.ts` helpers:** in scope (`files: ["src/**/*.{ts,tsx}"]`). Recorded because the event-color
sibling deliberately excludes `.ts`; here a `.ts` helper returning style objects is the same
escape as a `.tsx` one.

### D2. Key classification

| Category | Keys | Reported value |
| --- | --- | --- |
| `colors` | `color`, `tintColor`, any key ending in `Color` (per-side border colors, `shadowColor`, `textDecorationColor`, `placeholderTextColor`, `underlineColorAndroid`, …) except `themeColor`; same names as JSX attributes | color string (D3) |
| `typography` | `fontSize`, `lineHeight`, `fontWeight` | any number or string literal (`"600"`, `600`, `"bold"`) |
| `shadows` | `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation` | any value (the key is banned) |
| `shadows` | `boxShadow` | a string or template literal (the token is `Elevation.raised`) |
| `spacing` | `/^(padding\|margin)(Top\|Bottom\|Left\|Right\|Start\|End\|Horizontal\|Vertical\|Block\|BlockStart\|BlockEnd\|Inline\|InlineStart\|InlineEnd)?$/`, `gap`, `rowGap`, `columnGap` | number literal other than 0, 1 |
| `radius` | `/^border(TopLeft\|TopRight\|BottomLeft\|BottomRight\|TopStart\|TopEnd\|BottomStart\|BottomEnd\|StartStart\|StartEnd\|EndStart\|EndEnd)?Radius$/` | number literal other than 0, 1 |

`shadowColor` is reported once, under `shadows` (the key is banned regardless of value), not
also under `colors`. `fontWeight` reports any literal, not only numerals: the ramp owns weight,
and a `"bold"` is the same escape. `themeColor` is excluded by name: its type is the
`ThemeColor` key union, so the type checker already confines it. JSX attributes are checked for
`colors` only (no RN prop takes spacing or type directly); a `*Color` attribute whose value is an
object (`trackColor={{ true: "#0f0" }}`) has each property value checked.

### D3. What counts as a literal

A value resolver unwraps, recursively: `TSAsExpression`, `TSSatisfiesExpression`,
`TSNonNullExpression`, `TSTypeAssertion` (the cast blind spot); both branches of a
`ConditionalExpression`; both operands of a `LogicalExpression`; `UnaryExpression` `-`/`+`
on a number; a `BinaryExpression` whose operands are both literal numbers (`8 * 2`); and the
property values of the object argument of `Platform.select(…)` (member call on `Platform`). It
yields the literal leaves. Everything else (identifiers, member reads such as `Spacing.two` or
`StyleSheet.hairlineWidth`, other calls such as `PlatformColor(…)`) is not a literal and passes.

Color strings: `/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i`, `/^(rgba?|hsla?)\(/i`, or a
case-insensitive member of the CSS named-color set (the 148 CSS Color 4 keywords) minus
`transparent`. A template literal counts when its first quasi matches the hex or functional
prefix (`` `#${hex}` ``, `` `rgba(${r}, …)` ``). `transparent` passes because it is not a color
choice and no token should model it. Spacing and radius: only number leaves are checked, so
`"auto"` and `"50%"` pass; 0 and 1 (and `-0`) pass, every other number fails, negatives
included.

### D4. Options and messages

Schema: one object, `{ colors, typography, shadows, spacing, radius }`, all booleans. Defaults:
`colors: true`, `shadows: true`, `typography: false`, `spacing: false`, `radius: false`
(the proposal's "behind an option" categories are opt-in). `eslint.config.js` always passes the
full object explicitly. Message ids `colorLiteral`, `typographyLiteral`, `legacyShadow`,
`spacingLiteral`, `radiusLiteral`, each naming the replacement (`useTheme()` colors, `ThemedText
type=` / `TypeRamp`, `Elevation.raised`, `Spacing`, `Radii` / `ListGeometry`) and pointing to
"lint-format.md → Style literals, ADR 077". The message id is also the ratchet's category key
(D6).

### D5. Scope and exemptions

Block `timecalendar/style-literals`, `files: ["src/**/*.{ts,tsx}"]`, ignores:
`generatedCode`, `src/theme/**` (tokens, ramp, `EventFallbackColor`, the tokens gallery),
`src/features/personal-events/ui/color-swatch-presets.ts`, `src/test-support/**`,
`**/*.test.{ts,tsx}`. Galleries (`*.gallery.tsx`) are in scope: their layout wrappers are UI.

- "Data fallback constants": resolved to `src/theme/event-appearance.ts`, already covered by
  `src/theme/**`; no extra entry.
- `src/components/chrome/**`: a second block with `typography: false` (SwiftUI/Compose
  modifiers and the RN text that mirrors them are not on the RN ramp). Other categories stay on.
- Calendar renderer (`src/features/calendar/renderer/**`): **in scope and allowlisted**, unlike
  the sibling rules that ignore it. The L5–L7 exemption list in the proposal does not name it,
  the audit counts its escapes, and tokens are plain numbers usable in worklets. Its entries are
  tagged 5.10 (screen chrome: the chooser) or 5.11 (tiles); they are the residual floor if 5.11
  never runs, which is visible debt rather than a silent exemption.

### D6. Per-category ratchet that composes in flat config

`tools/eslint-rules/style-literal-allowlist.js` exports `styleLiteralAllowlist`, an array of
`{ path, categories }` sorted by path, each line followed by a comment naming the migrating
slice:

```js
{ path: "src/features/home/ui/home-screen/welcome-card.tsx", categories: ["typography"] }, // 5.9
```

Categories are the message ids from D4. `eslint.config.js` appends, after the base and chrome
blocks, one block per entry (`name: "timecalendar/style-literals-allowlist"`,
`files: [entry.path]`) whose options are the file's base options (chrome or not) with the listed
categories set to `false`. Flat config gives the last matching block's options to a rule, so the
per-file block overrides the base for exactly that file and keeps every unlisted category on.

- Alternative: spread the allowlist into `ignores` (the sibling pattern). Rejected: it would
  exempt a file from all five categories because it violates one.
- Alternative: five rules or five blocks with the same rule. Rejected: one rule is the
  requirement, and same-rule blocks override rather than merge.
- Alternative: an `allow` option inside the rule reading `context.filename`. Rejected: puts
  config in the rule and departs from the config-owned allowlist the book documents.

`style-literal-allowlist.test.js` (pattern: `raw-event-color-allowlist.test.js`) builds one
`ESLint` with the rule on and every category `true`, lints every listed path, and asserts:
each path exists; no path is listed twice; every category is a known message id; every listed
category has at least one message with that id in that file (otherwise it fails naming
`path:category`); and for each category the count of entries listing it is at most
`STYLE_LITERAL_ALLOWLIST_CEILING[category]`, a committed object set to the generated counts.
Raising a ceiling needs a reason in review.

**Generation:** once, by running the rule with all categories on and no allowlist over `src/`
(`npx eslint --no-cache --format json …` with a temporary config or the base block alone) and
mapping each file's distinct message ids to an entry. The command is recorded in the PR body;
no generator script is committed, since the list only ever shrinks by hand.

### D7. Design layer and chrome are fixed, not listed

- `design/status/error-surfaces.tsx:97-99`: the `ErrorMessage` title drops its literal
  `fontSize`/`lineHeight`/`fontWeight` and uses `ThemedText type="sectionTitle"` (iOS 20/25/600,
  Android 22/28/400), keeping `accessibilityRole="header"` and `marginBottom: Spacing.two`. The
  ramp is the design reference; this is the one visible change.
- `design/list/list-row.tsx:517` `borderRadius: 7` and
  `components/chrome/native-list-header.tsx:130` `borderRadius: 20`: become named tokens in
  `ListGeometry.ios` next to `leadingIconTile: 29` (for example `leadingIconTileRadius: 7`) and
  for the 88-unit header icon (for example `headerIconRadius: 20`, with the size as a sibling
  token). Values unchanged.
- `design/badge/badge.gallery.tsx:65` `eventColor="#E91E63"`: the sample is event data, not a
  style; it moves into a module-level sample constant like the color-dot and event-surface
  galleries' palettes.
- `native-list-header.tsx` typography literals stay (chrome, `typography: false`).

If the rule's run finds further design or chrome hits than the census, each is fixed the same
way when it is a token swap with no visual change, or allowlisted with a reason comment; a
design-layer entry must say why it cannot use a token.

### D8. Known blind spots (documented, not encoded)

A literal behind a variable or imported constant (`const RED = "#f00"`); a literal inside a
spread identifier; `PlatformColor` and `DynamicColorIOS` (native-correct per R-2, not literals);
computed keys; style keys outside D2 (width/height/position/`borderWidth`/`letterSpacing`);
SwiftUI/Compose modifier arguments (`padding(12)`, `font({ size })`), which are calls or other
key names. lint-format.md lists these; review covers them, as for the siblings.

## Decision

**ADR 077 — Visual-style lint ratchet** (roadmap ADR "E"; 075 and 076 are taken, no open PR
reserves 077).

- **Decision:** visual-style literals (color, type, legacy shadow, spacing, radius) are one
  local rule with per-category options, applied to all hand-written `src/**` code including
  `.ts` helpers and the calendar renderer, with theme, presets, fixtures and tests exempt and
  chrome exempt from typography only. Not-yet-migrated files sit on a committed per-file,
  per-category allowlist applied through generated per-file config blocks, pinned by a
  per-category ceiling test. Every migration slice deletes its files (or categories) from the
  allowlist in the same PR.
- **Alternatives rejected:** big-bang migration (blocks Phase 5 ordering, large unreviewable
  diff); warning-level rule (breaks `--max-warnings 0`); `ignores`-style whole-file allowlist
  (lets a listed file regress in clean categories); five separate rules (one concept, five
  inventories); permanent renderer exemption (hides real drift).
- **Consequences:** Phase 5 slices have a measurable exit (their allowlist rows disappear); a new
  screen cannot add a literal; the renderer's entries remain until a renderer slice; variable
  indirection remains a review item.
- **Revisit if:** the allowlist reaches zero (drop the per-file block machinery), a category's
  false positives on data objects need context detection, or a token family is added (extend D2).

## Risks / Trade-offs

- [Data objects with style-named keys are reported] → scope excludes fixtures and presets; the
  RuleTester suite pins `{ color: row.color }` as valid; a real hit is fixed by naming the
  constant in `src/theme/` or a data module outside the key form.
- [A future token-name prop ending in `Color` collides with a CSS color keyword] → only
  `themeColor` is excluded by name; any other `*Color` prop holding a string that is a CSS
  color keyword is reported, which is the safe direction. The RuleTester suite pins
  `themeColor="red"` as valid so the exclusion is deliberate, not accidental.
- [Per-file blocks lengthen `eslint.config.js` output] → generated by one `map`, named, and
  shrinking.
- [The error title changes size] → it lands on the platform ramp the rest of the app uses; the
  error-surfaces tests and gallery stories cover it; the conductor's simulator pass checks it.
- [Flat config ordering] → the allowlist blocks must come after both base and chrome blocks; the
  allowlist test's stale check plus an inject-and-revert run (tasks) prove the composition.

## Migration Plan

1. Commit 1: rule, RuleTester suite, plugin registration (no config wiring).
2. Commit 2: token additions, design/chrome/gallery fixes, config blocks, generated allowlist,
   allowlist test. Lint is green at this commit.
3. Commit 3: ADR 077, lint-format.md, theming.md, CHANGELOG, roadmap status.

Rollback: revert commit 2's config blocks; the rule is inert without them.
