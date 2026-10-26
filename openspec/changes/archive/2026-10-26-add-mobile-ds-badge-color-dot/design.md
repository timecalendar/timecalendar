# Design

## Context

See proposal.md for motivation. Constraints that shape the approach:

- **Layering (ADR 068).** `@/theme` ← `@/hooks` ← `@/components/chrome` ← `@/design` ← features.
  Chrome imports a design leaf by path (`@/design/text/themed-text`,
  `@/design/list/row-name`), never the barrel. Inside `src/design/` a folder reaches another
  through `@/design/<folder>/<file>`. `src/design/import-graph.contract.test.ts` fails on a
  require cycle through `src/design/`, so a design primitive that chrome imports must not import
  chrome back.
- **Primitive conventions (design-system-proposal §2).** `variant`/`tone` are closed unions; `size`
  maps to tokens only; `style` merges last and is layout-only; no `color` prop; `testID`
  passthrough; accessibility state is derived from props. Data colors enter UI only through
  `ColorDot` / `EventSurface`.
- **Icon precedent (ADR 065, accessibility.md).** `Icon` is always decorative; the control that
  contains it owns the label. `scaling` is required.
- **Contrast gate (theming.md, `src/theme/contrast.ts`).** `documentedContrastPairs` rows are
  `[foreground, background, floor]` over opaque tokens; `relativeLuminance` throws on an alpha hex,
  so a translucent wash such as `primarySoft` (`#E91E631F` / `#FF40811F`) cannot be checked today.
  Measured by compositing the wash over each surface: `actionText` on it is 4.88:1 over `background`
  but 4.30:1 over `backgroundElement` and 4.12:1 over `homeHero` (light), 4.17:1 over dark
  `backgroundElement`. The About caption pill sits on the iOS grouped form background, a
  `backgroundElement`-class gray, so its label misses 4.5:1 today.
- **Existing sites (A14/A15).**
  - `chrome/native-list-header.tsx:68-77,154-165`: brand caption pill, custom 13/18/600 type,
    `paddingHorizontal: 12`, `captionTestID` on the text (`about-version` on About).
  - `event-checklists/ui/checklist-progress-indicator.tsx:66-100`: outlined pill in
    `positive`/`informational`, glyph plus `completed/total`, hidden from assistive technology
    (owning summaries carry `checklistProgressLabel`). `inline` is used by Home today, upcoming and
    timeline cards and by the agenda. `compact` (with `bounds` and a `dense` fit) is used by the
    calendar renderer grid tile and the Home timeline block.
  - `personal-events/ui/personal-events-list.tsx:103-111,124,138-142`: a 24-unit `Radii.small`
    square as the `ListRow` caller-element leading, hidden.
  - `home/ui/home-screen/welcome-card.tsx:73-91,117-125`: up to five 12-unit dots with a 2-unit
    `#FFFFFF` border, overlapping by `Spacing.one`, hidden; a `+N` overflow text.
- **Maestro.** No flow selects `about-version`, `checklist-progress-*`, `personal-event-row-*`
  swatches or Home dots. Flows match the personal-event row by its title, which this change does
  not touch.
- **Release status.** The RN app is not in production; Flutter is the parity bar. Visual
  convergence on the new primitives is acceptable without a migration path.

## Goals / Non-Goals

**Goals:**

- One `Badge` and one `ColorDot`, type-encoded, token-only, contrast-checked in both schemes.
- The four roadmap sites (header pill, checklist pill, personal events, Home dots) migrated with
  identifiers and accessible names unchanged.
- A ratchet that keeps raw event-color fills out of feature UI.

**Non-Goals:**

- `EventSurface`, tile washes and the accent stripe (3.9).
- A `large` badge size or soft fills for the status tones: nothing consumes them.
- Spoken color names for arbitrary server colors: only personal-event presets have names, and no
  migrated site makes color the only carrier of meaning.
- Any change to the native list seam's `SwiftBadge` / Compose `Badge`.

## Decisions

### D1. Badge: the tone fixes the appearance

`tone` selects one fixed appearance:

| tone | fill | stroke | label |
| --- | --- | --- | --- |
| `brand` | `primarySoft` | none | `onPrimarySoft` |
| `neutral` | `backgroundElement` | none | `textSecondary` |
| `positive` | none | 1 unit `positive` | `positive` |
| `informational` | none | 1 unit `informational` | `informational` |
| `destructive` | none | 1 unit `destructive` | `destructive` |

The brand caption and the checklist pill are the two existing looks, and each keeps its look. The
status tones have no soft fill token, and inventing three translucent tokens for zero consumers is
speculative. Alternatives: a separate `appearance: "soft" | "outlined"` prop (doubles the matrix
to ten combinations, six with no consumer and no contrast pair); all outlined (changes the About
caption, which theming.md calls correct). The five-tone union is the proposal's (§2). `neutral`
and `destructive` have no product consumer yet. Each is one table row with a contrast pair, so
they ship for the proposal's union and are covered by the gallery.

### D2. Badge anatomy, size and text scaling

- Props: `label: string`, `tone: BadgeTone`, `size?: "small" | "medium"` (default `medium`),
  `icon?: { ios?: SFSymbol; android?: MaterialGlyph }`, `accessibilityLabel: string | null`,
  `testID?: string`, `style?: BadgeLayoutStyle` (layout keys only, applied last).
- Type: `small` → `ThemedText type="caption"`, `medium` → `type="label"` (both platform-resolved by
  the ramp, ADR 063). Padding: `small` `Spacing.two` × `Spacing.half`; `medium`
  `Spacing.twoHalf` × `Spacing.one`. Gap `Spacing.one`. Radius `Radii.pill`. `alignSelf:
  "flex-start"`, `flexShrink: 1`, `maxWidth: "100%"`.
- Icon: `Icon scaling="text"` sized to the label's resolved `fontSize` from `TypeRamp` (so it
  tracks the platform ramp, ADR 063), color = the label color. It is decorative per ADR 065.
- Text scaling: no fixed height and no `adjustsFontSizeToFit`. The label has `numberOfLines={2}`
  (a cap, never `clip`: an uncapped iOS `Text` can clip its last word) and
  `fontVariant: ["tabular-nums"]` so counts do not jitter. At accessibility sizes the pill grows
  and wraps instead of clipping. `Radii.pill` on a two-line badge draws a stadium, which is
  intended.
- `testID` is on the root; the label gets `${testID}-label` and the icon `${testID}-icon`.

Alternative rejected: one line with ellipsis. An ellipsized count or version is information loss
at exactly the text sizes that need it.

### D3. Badge accessibility is a required choice (type-encoded)

`accessibilityLabel: string | null` is required, with no default.

- A string: the root is `accessible`, `accessibilityRole="text"`, with that label. The visible
  label is not read separately. A count reads as a phrase, not a bare number.
- `null`: the root is `accessibilityElementsHidden` and `importantForAccessibility=
  "no-hide-descendants"`, for a badge whose owning summary already says it (the checklist pill:
  the event-checklists spec requires one composed phrase on the owner).

Requiring the prop makes "a count read as a bare number" a type error rather than a review
finding (Principle 1). Alternatives: optional with the visible label as default (silently reads
`2/5`); a boolean `decorative` plus optional label (two props that can contradict each other).

### D4. ColorDot: always decorative, circular, surface ring

- Props: `color: string` (the stored `#RRGGBB`, never re-encoded, ADR 011), `size?:
  "small" | "medium" | "large"` (default `medium`), `ring?: "background" | "backgroundElement" |
  "homeHero"`, `testID?`, `style?` (layout keys only, last).
- Geometry: `ColorDotSize = { small: 8, medium: 12, large: 16 }` in `@/theme`, a circle
  (`Radii.pill`). A `ring` draws a 2-unit border in that theme token, inside the box, so outer
  geometry does not change. Size is fixed, not text-scaled: a dot is a marker beside text, and a
  fixed slot keeps `ListRow` leading widths stable.
- Accessibility: always `accessible={false}`, `accessibilityElementsHidden`,
  `importantForAccessibility="no-hide-descendants"`, matching `Icon`. There is no label prop.

**Why decorative-only.** The proposal (§2) specifies it. At every migrated site color is
redundant: the personal-event row is announced by its title (the shared Maestro flow matches the
row by exactly the title), and the Home summary announces the count. WCAG 1.4.1 is met because
color is never the sole carrier. Where color is the subject, the owning control names it. The
personal-events swatch picker does this through `SWATCH_NAME_KEYS` (#485), and that is the
color-name logic to reuse. It stays in the feature because `src/design/` cannot import
`features/**` (ADR 068), and server colors have no names. A future screen that needs to speak a
color passes the name to its own control's label, not to the dot.

**Why a token ring.** The Home dots overlap, and the white ring separates them. A ring in the
surface's own token reads as a cut-out in both schemes (the avatar-stack idiom) and removes the
`#FFFFFF` literal. Callers name a surface token, not a color value, so "no `color` prop" holds.
Alternative: a `ringColor` string (reopens raw colors).

**Why a circle.** iOS Calendar and Google Calendar both mark calendars with circles. The
personal-events rounded square was one of five shapes in A15. The swatch picker keeps its
48 pt rounded squares until slice 5.3 because it is an input control, not a dot.

### D5. `onPrimarySoft` and composited contrast pairs

- New color role `onPrimarySoft`: light `#AD1457`, dark `#FF80AB` (the M3 on-container idiom; same
  values as `homeHeroDate`, the other strong-pink-on-pink-paper text, which keeps one pink-on-wash
  ramp). `actionText` stays the brand text tone on neutral surfaces.
- `ContrastPair` gains `over?: ThemeColor`. With `over`, the background token is alpha-composited
  over that opaque surface (`composite(fill, over)` in `contrast.ts`, straight alpha, rounded
  channels) before `contrastRatio`. A translucent background without `over` throws, as today.
- New pairs (both schemes, body floor): `onPrimarySoft` on `primarySoft` over `background`,
  `backgroundElement`, `homeHero` (light 5.79 / 5.10 / 4.88; dark 8.11 / 5.90 / 5.89);
  `destructive` on `background` (6.54 / 12.37). `textSecondary` on `backgroundElement`, and
  `positive` / `informational` on `background` and `backgroundElement`, are already documented.
  `tokens.ts` doc comments list the computed values.
- The theme test's `describe.each(documentedContrastPairs)` composites when `over` is set.
  `tokens.gallery.tsx` draws the composited swatch.

Alternative: an opaque `brandContainer` fill. That changes the caption's look on every surface
and still needs a label token. Lowering the alpha does not reach 4.5:1 over `backgroundElement`
with `actionText` either.

### D6. Checklist pill: `inline` through Badge, `compact` stays

`ChecklistProgressIndicator variant="inline"` renders
`<Badge tone={complete ? "positive" : "informational"} size="medium" icon={GLYPH[...]}
label={`${completed}/${total}`} accessibilityLabel={null} testID="checklist-progress-inline" />`.
`variant="compact"` keeps its own drawing (`bounds`, `dense` 8/9 type, `adjustsFontSizeToFit`):
that geometry is fitted inside calendar grid tiles whose size the renderer decides, which is
slice 3.9/5.11's `EventSurface` work and the ADR 033 renderer boundary. The inline sub-identifiers
become `checklist-progress-inline-icon` / `-label`; the compact ones (`checklist-progress-glyph`,
`checklist-progress-count`) are unchanged. No Maestro flow uses either. The owning summaries'
`checklistProgressLabel` phrase is unchanged.

### D7. Header caption: chrome renders Badge by path

`NativeListHeader` imports `Badge` from `@/design/badge/badge` (a design leaf, as with
`themed-text`). It renders `<Badge tone="brand" size="small" label={caption}
accessibilityLabel={caption} testID={captionTestID} />` with `alignSelf: "center"` and the existing
`marginTop`. `badge.tsx` imports only `@/theme`, `@/design/text/themed-text` and
`@/design/icon/icon`, never chrome, so no cycle forms (the graph test proves it). The header is
hosted RN content (`RNHostView`), so the badge scales with the OS font. ADR 068's "revisit if chrome
needs a design module beyond `text/`" is already met by `list/`; ADR 074 records `badge/` as a
third leaf, and the design-import policy test gains no new class.

### D8. Lint: `local/no-raw-event-color`, ratcheted

- Rule (`tools/eslint-rules/no-raw-event-color.js`, block `timecalendar/raw-event-color`,
  `files: ["src/**/*.tsx"]`): it reports a non-computed `Property` with key `backgroundColor` or
  `borderColor` whose value is a non-computed `MemberExpression` (optional chains included) with
  property `color`, unless the object is the identifier `theme`. Message: "Event colors are
  ColorDot (or EventSurface) from @/design (ADR 074, lint-format.md → Badges and dots)."
- Ignored: `src/design/**`, `src/theme/**`, `src/features/calendar/renderer/**` (owned renderer,
  ADR 033), `**/*.test.{ts,tsx}`, and `tools/eslint-rules/raw-event-color-allowlist.js` =
  `["src/features/calendar/ui/event-details-content.tsx"] // 5.8 title dot and TagBubble`.
- `raw-event-color-allowlist.test.js` fails on a stale entry (a listed file with no violation), a
  missing file, a duplicate, or a list longer than `RAW_EVENT_COLOR_ALLOWLIST_CEILING` (1).
  `no-raw-event-color.test.js` is the RuleTester suite: `event.color`, `tag.color`, `item?.color`
  and `borderColor` fail; `theme.text`, `{ backgroundColor: hex }`, `eventSurfaceColor(event.color,
  scheme)` and `color: event.color` (a data-object key, not a style fill) pass.
- **Caveats (documented, not hidden):** a value through a variable or a call is not followed
  (`eventSurfaceColor(...)` is the 3.9 `EventSurface` seam); a `color=` JSX prop is not matched.
  Today's raw sites are exactly the four the grep finds (Home, personal events, event details ×2);
  after migration only the allowlisted file remains.
- No pill/dot shape rule: `borderRadius: Radii.pill` also draws FABs, glass buttons, the now line,
  the agenda rail and page indicators (13 sites), so it is no badge signature. Phase 4's
  `no-style-literals` handles the remaining literals.

### D9. Call-site mapping and deferrals

| Site | Becomes | Kept |
| --- | --- | --- |
| `chrome/native-list-header.tsx:68-77` | `Badge brand small` | `captionTestID` (About: `about-version`) on the badge root |
| `event-checklists/ui/checklist-progress-indicator.tsx:66-100` (inline) | `Badge positive/informational medium` + glyph, hidden | `checklist-progress-inline`; owner phrases |
| `personal-events/ui/personal-events-list.tsx:103-111` | `ColorDot large` in `leading.element`, width `ColorDotSize.large` | `personal-event-row-<uid>`, label = title, hint |
| `home/ui/home-screen/welcome-card.tsx:73-85` | `ColorDot medium ring="homeHero"` ×≤5, overlap kept | hidden dots row, `+N`, count text |

Deferred: `event-details-content.tsx:99-112` title dot (strut-centred) and `:149-155` `TagBubble`
→ 5.8 (`EventSurface`/`Badge`; text on `tag.color` needs the 3.9 `onEventColor` resolution);
`calendar-view-menu.tsx:100-120` view pill → 5.10 (a `MenuView` trigger with a chevron, not a
badge); `agenda-list.tsx:180-184,238-241` indicator column → 3.9; `color-swatch-picker.tsx` → 5.3;
`welcome-page-indicator.tsx` → 5.1; checklist `compact` → 3.9/5.11; `native-list.tsx` `SwiftBadge`
/ `MaterialBadge` → stays native (proposal §2).

### D10. Gallery

- `badge.gallery.tsx` (`design-badge`): `Tones` (five tones at medium, labelled), `Sizes`
  (small/medium per tone), `WithIcon` (complete/pending checklist glyph pair), `Accessibility`
  (labelled count "2/5" → "2 of 5 checklist items completed", and a hidden badge inside a labelled
  container), `LongStrings` (the longest FR label wrapping in a narrow column, with a caption from
  `useIsAccessibilityTextSize` naming the text-size branch, as in `list-row.gallery.tsx`).
- `color-dot.gallery.tsx` (`design-color-dot`): `Sizes`, `Presets` (the fixture lists its own eight
  literal hexes: `SWATCH_PRESETS` is feature data that `src/design/` cannot import), `Rings` (a dot on
  each ring surface), `Stack` (five overlapping dots plus `+N` on `homeHero`).
- Strings in `gallery.badge.*` / `gallery.colorDot.*`, FR/EN parity. Fixture labels are gallery
  keys; the hidden-container fixture's owner label is a gallery key.
- `registry.ts` gains both modules (after `separator`). `registry.test.ts` renders every story
  light/dark × iOS/Android. `known-a11y-violations.ts` is unchanged: a labelled badge is a `text`
  element with a name, and hidden badges and dots are not in the a11y tree.

### D11. Tests and coverage

- `badge.test.tsx`: each tone's fill/stroke/label colors in light and dark (`Colors.*`), each size's
  type and padding, icon presence/absence and `scaling: "text"` growth at `fontScale` 3, the
  labelled accessibility (role `text`, name, no separate label node), hidden (`null`), no
  `numberOfLines` other than 2, layout `style` applied last, sub-testIDs. `// @ts-expect-error`
  proofs: no `accessibilityLabel`, a `color` prop, a non-layout style key.
- `color-dot.test.tsx`: size → token, circle radius, `color` verbatim, ring border per surface token
  per scheme, decorative props, layout style last, `@ts-expect-error` on `ringColor`/`accessibilityLabel`.
- `*.gallery.test.tsx` for both (story list equals exports, each renders).
- Call sites: `native-list-header.test.tsx` asserts the caption label in `onPrimarySoft` and the
  fill `primarySoft`; `checklist-progress-indicator.test.tsx` asserts the inline badge's tone colors
  and hidden state, and compact is unchanged; `personal-events-list.test.tsx` asserts the dot color
  and hidden state, and the row label is exactly the title; `home-screen.test.tsx` /
  `welcome-card` asserts ≤5 dots with the `homeHero` ring and `+N`.
- `theme.test.tsx`: composited pairs, `onPrimarySoft` light/dark, `ColorDotSize`; a unit test for
  `composite` (opaque over, 0 and 1 alpha, the alpha-without-`over` throw).
- `jest.config.js` 90% rows: `src/design/badge/badge.tsx`, `src/design/color-dot/color-dot.tsx`.
  `src/theme/**` is already 90%-gated.

### D12. ADR 074

The decisions are costly to reverse once phase 5 screens adopt them: the tone→appearance table,
the required `accessibilityLabel: string | null`, the decorative-only dot with a surface-token
ring, the `onPrimarySoft` role and composited contrast pairs, and the `no-raw-event-color` ratchet.
ADR `074-badge-and-color-dot.md` (Status, Context, Decision, Rejected, Consequences, Revisit if),
plus a README index row. 074 is the next free number on `origin/main` (073 is the highest; no open
PR adds a decision file). Task 0.1 re-checks this.

## Risks / Trade-offs

- [The dark Home ring changes from white to the dark hero] → intended (white rings on a dark card
  are glare). Device pass in both schemes.
- [The `compact` checklist pill stays bespoke, so the indicator has two drawing paths] → bounded
  by the renderer slice; D6 records it, and the ADR's "Revisit if" names 3.9.
- [The rule misses colors reached through variables or calls] → documented caveat. Review checks
  new event-color UI uses `ColorDot`, and 3.9 brings `EventSurface` for washes.
- [Light event colors (yellow, light blue) on light surfaces fall below 3:1 as dots] → decorative
  and never the sole carrier (WCAG 1.4.11 exempts it). The ring option exists for overlap, not
  contrast.
- [Badge two-line wrap at AX5 makes the About header taller] → acceptable; it does not clip. Device
  pass at the largest size.
- [`onPrimarySoft` duplicates `homeHeroDate`'s values] → two roles with different meaning, kept
  separate so either can move. The contrast test pins both.

## Migration Plan

Three commits on `feat/mobile-ds-badge`:

1. Theme (`onPrimarySoft`, `ColorDotSize`, composited pairs) and the primitives (`Badge`,
   `ColorDot`, fixtures, tests, registry, barrel, i18n, jest tiers).
2. Lint rule, allowlist and tests, then the four call sites with their tests.
3. Docs: ADR 074, Book files, CHANGELOG, inbox device-pass note.

Rollback is a revert of the PR; no data, native or store impact.
