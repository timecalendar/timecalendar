# Design

## Context

Roadmap row 5.1 (`docs/mobile/design-system-audit/migration-roadmap.md:74`) covers three routes,
all thin re-exports of the onboarding feature:

| Route | Route file | Screen modules |
| --- | --- | --- |
| `/onboarding` | `mobile/src/app/onboarding/index.tsx` | `welcome-screen.tsx`, `welcome-controls.tsx`, `welcome-entrance.tsx`, `welcome-page-catalog.ts`, `welcome-page-indicator.tsx`, `welcome-pager.tsx`, `welcome-pages.tsx` |
| `/onboarding/connect` | `mobile/src/app/onboarding/connect.tsx` | `connect-screen.tsx` |
| `/onboarding/import` | `mobile/src/app/onboarding/import.tsx` | `manual-import-screen.tsx` |

All screen modules live in `mobile/src/features/onboarding/ui/`. The audit's findings for these
screens (`screen-inventory.md:241-280`, `duplication-and-drift.md:100-135`) predate slice 3.1. The
current tree is further along:

- Every CTA is already the shared `Button`: welcome Skip/Next `text`, final CTA `large` `filled`
  (`welcome-controls.tsx:18-70`); connect intranet link `outlined` with `link` role, Back/Continue
  in a `ButtonRow` (`connect-screen.tsx:61-97`); manual import QR `filled` and URL `outlined`
  (`manual-import-screen.tsx:43-67`). The spec already requires this ("Onboarding buttons use the
  shared button family", `openspec/specs/mobile-onboarding-flow/spec.md:383`).
- No raw `Pressable`, `Text`, `TextInput`, `SymbolView` or `ActivityIndicator` remains.
- None of these files is on any ratchet allowlist (`tools/eslint-rules/*-allowlist.js`); the
  only `welcome-` hit is Home's `welcome-card.tsx` (slice 5.9), which is not ours.

The scoped audit greps (`duplication-and-drift.md:28-66`, run over the files above) leave this
residue:

| File:line | Hit | Why it matters |
| --- | --- | --- |
| `welcome-pages.tsx:62` | `themeColor="textSecondary"` | Deprecated color prop; slice 4.3 deletes it once unused. `tone="secondary"` is the same color. |
| `welcome-page-indicator.tsx:18` | `Platform.OS === "ios" ? 44 : 48` | Hand-rolled copy of `MinTouchTarget` (`tokens.ts:256`). |
| `welcome-controls.tsx:78` | `height: 60` | Fixed height on the Skip bar: Skip is a `small` button whose label grows with Dynamic Type, so at AX sizes the bar clips it. |
| `welcome-controls.tsx:83` | `minHeight: 64` | Dead: the footer always holds a button at least `MinTouchTarget` tall plus `paddingBottom: Spacing.four`, so its box is ≥ 68 (iOS) / 72 (Android). Yoga's `minHeight` is border-box. |
| `welcome-pages.tsx:87` | `maxWidth: 480` | Inline magic number; the sibling cap `MAX_ILLUSTRATION_HEIGHT = 260` is already a named constant (`welcome-screen.tsx:20`). |
| `welcome-entrance.tsx:10`, `welcome-page-indicator.tsx:15` | `FADE_IN_MS = 300`, `INDICATOR_ANIMATION_MS = 150` | Raw durations beside the `Motion` tokens (`tokens.ts:291-295`: 150 / 250 / 400). |

Comments: `connect-screen.tsx:16-33` cites tickets and says Continue leads to
`/onboarding/import`, but the code pushes `/onboarding/export-guide/0` (`:93`), matching the
journey in `features.md:27`. `manual-import-screen.tsx:14-24` narrates history ("finally", "until
now"). The route comments `app/onboarding/index.tsx:1-4` ("is now") and
`app/onboarding/connect.tsx:1-2` (the same wrong Continue target) have the same faults.

Not a residue: style arrays in `welcome-entrance.tsx:34`, `welcome-page-indicator.tsx:58` and
`welcome-pages.tsx:38` compose an animated or measured value with a static style;
`connect-screen.tsx:56` composes the shared step frame with the step's wider gap. Indicator pill
widths (24 / 16) are named constants for a product-specific control with no token family. Raw
`View`s are layout containers, which no gate or primitive covers.

## Goals / Non-Goals

**Goals:**

- Zero hits of the scoped audit drift greps in the 5.1 files, with the same rendering on iOS and
  one deliberate 4 dp change on Android (D2).
- Encode the Phase 5 exit criterion as a CI gate (R-1) that later slices extend (D4).
- Keep every label, accessibility label/hint/role, route, draft write and `onboarding-*` selector.

**Non-Goals:**

- Slice 5.2 files: `institution-name-screen.tsx`, `programme-screen.tsx`, `step-styles.ts`
  (shared with them), `calendar-sources/ui/ical-url-screen.tsx`, the feedback screen. A parallel
  change owns them. `connect-screen.tsx` and `manual-import-screen.tsx` keep importing
  `stepStyles` unchanged.
- Slice 4.3 (deleting `themeColor` and the legacy type aliases from `ThemedText`).
- A new primitive (a page indicator or illustration surface). One consumer each; R-2 says earn it.
- Changing the pill indicator into a platform page control. It is the product's design, specified
  in `mobile-onboarding-flow`, and no native control on Android matches it (R-3: no speculative
  divergence).

## Decisions

### D1. Body copy uses `tone="secondary"`

`welcome-pages.tsx:62` becomes `<ThemedText tone="secondary" …>`. Same resolved color
(`themed-text.tsx:41-47`), and it moves the file off the prop slice 4.3 removes. The title keeps
`type="title"` (a current ramp step, heading role) and `maxFontSizeMultiplier={WordmarkMaxFontScale}`.

### D2. Skip bar: `minHeight: MinTouchTarget + Spacing.three`, no fixed height

Alternatives:

- Keep `height: 60`: clips Skip at accessibility sizes (a defect, not a style).
- `minHeight: 60` literal: fixes clipping but keeps a magic number the gate would have to allow.
- `minHeight: MinTouchTarget + Spacing.three` (chosen): 60 on iOS (unchanged), 64 dp on Android.
  The bar keeps its height when Skip is hidden on the last page, so the pager does not jump at
  default sizes, and it grows with Skip at large sizes. 64 dp sits on Material's 8 dp grid with the
  same 8 dp breathing room above and below the 48 dp target that iOS has around 44.

The footer's `minHeight: 64` is deleted (dead, see Context). The final CTA keeps
`style={styles.cta}` (`alignSelf: "stretch"`).

### D3. Tokens for the touch target and the transitions

- `CONTROL_MIN_HEIGHT` in `welcome-page-indicator.tsx` is replaced by `MinTouchTarget`; the
  `Platform` import goes.
- `FADE_IN_MS = 300` → `Motion.base` (250 ms). `INDICATOR_ANIMATION_MS = 150` → `Motion.fast`
  (150 ms, unchanged).

## Decision

**Context.** The welcome entrance fade (300 ms) is the only onboarding duration that is not on the
`Motion` scale (150 / 250 / 400). The spec names "the existing 300ms entrance fade".

**Decision.** Use `Motion.base` (250 ms) and amend the `mobile-onboarding-flow` accessibility
requirement to name the shared `base` and `fast` durations.

**Alternatives.** (a) Keep 300 ms as a local constant: one more private timing the token layer
exists to remove, and the next slice would ask the same question. (b) Add `Motion.entrance = 300`:
a token with one consumer, against R-2. (c) `Motion.slow` (400 ms): further from the current
feel. 50 ms on a decorative opacity fade is below what a user can tell apart, the fade runs only
when reduced motion is off, and Flutter's parity bar is behavioral (what appears, in what order,
what is announced), which does not change.

**Consequences.** The welcome test asserts `withTiming(1, { duration: Motion.base })` and advances
timers by `Motion.base`; a future change to the `Motion` scale moves the welcome fade with it.

### D4. Migrated-screen contract (R-1 for "scoped audit greps clean")

The Phase 5 row contract says each slice must "pass the scoped audit greps clean"
(`migration-roadmap.md:68-70`). ESLint already enforces most categories repo-wide
(`local/no-style-literals`, `local/no-raw-primitive`, `local/no-raw-button`, the
`ActivityIndicator`/`SymbolView` bans), but three drift patterns have no gate until slice 4.3 or
ever: `themeColor=`, the legacy `ThemedText` type aliases, and a hand-rolled 44/48 touch target.
And nothing keeps a migrated screen migrated if a later edit re-adds a literal under an allowlist
row from another category.

Mechanism: `mobile/src/design/screen-migration.contract.test.ts`, modelled on
`src/theme/brand-small-text.test.ts` (reads files with `jest.requireActual("node:fs")`, no new
dependency):

- `MIGRATED_SCREENS: ReadonlyArray<{ slice: string; files: readonly string[] }>`, paths relative to
  `mobile/`. Slice 5.1 seeds it with the twelve files in the table under Context: the three
  route files `src/app/onboarding/{index,connect,import}.tsx` and the nine
  `src/features/onboarding/ui/` modules `welcome-screen.tsx`, `welcome-controls.tsx`,
  `welcome-entrance.tsx`, `welcome-page-catalog.ts`, `welcome-page-indicator.tsx`,
  `welcome-pager.tsx`, `welcome-pages.tsx`, `connect-screen.tsx` and `manual-import-screen.tsx`
  (no 5.2 file).
- `DRIFT_PATTERNS: ReadonlyArray<{ id: string; pattern: RegExp }>` — the audit's violation greps
  (`duplication-and-drift.md:30-63`) minus the reference counters (`Spacing.`, `Radii.`), minus
  `Platform.OS|Platform.select` (platform branching is legitimate, R-2) and minus style arrays
  (needed to compose animated/measured values), plus `themeColor=`, `type="(default|small|smallBold|subtitle)"`
  and `\b(44|48)\b` inside a `Platform.OS`/`Platform.select` expression.
- `findDrift(source)` strips `//` line comments and `/* */` blocks before matching and returns
  `{ id, line }[]`.
- `MIGRATED_FILE_FLOOR` (12 after slice 5.1): the list length must stay at or above it; each
  slice raises it with its append, which is what makes "grow-only" enforced rather than stated.
- Tests: detector fixture (one example per pattern, one commented-out `themeColor=` that must not
  match), every listed file exists, no listed file has drift, no path listed twice, the floor holds.

Why a test and not an ESLint rule: the patterns are the audit's own regexes, the scope is an
explicit grow-only file list rather than a glob, and a Jest scan is the established form for
source-text contracts in this repo (`brand-small-text.test.ts`, `import-graph.contract.test.ts`).
Why in `src/design/`: it is a design-system contract over feature files, beside
`import-graph.contract.test.ts`.

Slice 5.2 runs in parallel. If it lands first with its own list, the two merge into this one file
(append the other slice's rows); the conflict is a list append.

### D5. Ratchets: nothing to remove

Census (task 0 re-runs it): `rg -n "onboarding/ui|app/onboarding" mobile/tools/eslint-rules/*-allowlist.js`
finds nothing. Ceilings stay: style-literal `{ colorLiteral: 1, typographyLiteral: 7,
legacyShadow: 0, spacingLiteral: 6, radiusLiteral: 3 }`, raw-primitive `{ rawText: 1, rawModal: 0 }`,
raw-button 5, raw-text-input 1, ad-hoc-status 2, ad-hoc-separator 1, header-action 1,
raw-event-color 1. If the census finds a 5.1 file after all, the implementer deletes its row and
lowers the matching ceiling by the number of rows removed, in the same commit.

### D6. Comments

Comments keep only the non-obvious why: in `connect-screen.tsx`, that the intranet link is gated on
`safeIntranetUrl` (http(s) only) because the URL is a server-owned string reaching a browser
opener, and that an unlisted institution never has a trusted URL; that Continue pushes the export
guide, which is where a later assistant step would insert. In `manual-import-screen.tsx`, that the
screen only orchestrates the two import routes, which own permissions, validation and failure
handling. Ticket ids, design-doc ids and history go. Route files keep one line naming the screen
they re-export.

### D7. ADR: extend 077, no new ADR

The contract is the Phase 5 counterpart of ADR 077's shrink-only allowlists (a grow-only list of
files that must stay clean). It is cheap to reverse and mechanical, so it extends 077's Decision
and Consequences in place, as slice 4.2 did, with no new ADR number.

### D8. Accessibility-size clipping is a runtime Dynamic Type defect, not welcome layout

The conductor's iOS pass at AX5 showed the title cut to "Welcome to TimeC", the body clipped to its
top pixels and Skip/Next in fragments. A cold launch at AX5 lays every page out correctly: the title
wraps to two lines, the body to three, Skip and Next stay whole, and the last page's CTA fits. The
clipping appears only when the text size changes while the app runs, and it appears on Home too:
every React Native text frame keeps its previous measurement while the glyphs draw at the new size
(both directions). It is app-wide React Native behavior (0.85.3, Fabric), so no welcome-file change
fixes it; an app-level workaround (remounting on a `fontScale` change) resets navigation state and
is a decision for the owner, filed in the migration inbox
(`2026-10-26-ios-runtime-dynamic-type-stale-text-layout.md`). Within this slice the welcome files
keep what makes the cold-launch layout correct: the Skip bar grows (D2), no welcome label sets a
one-line cap or `adjustsFontSizeToFit` (asserted in `welcome-screen.test.tsx`), and each page keeps
its scrolling `ScrollView`.

## Risks / Trade-offs

- [Android Skip bar grows 4 dp] → Intended (D2); the conductor's Android device pass confirms the
  pager and indicator still fit at default and AX sizes.
- [Regex contract has false negatives] (a literal behind a variable, a computed key) → Same blind
  spots as the audit greps it encodes; ESLint covers the style-literal categories structurally.
- [Regex contract has false positives on strings] (e.g. a translation default containing
  `themeColor=`) → None in the 5.1 files; a later slice that hits one narrows the pattern in the
  same change.
- [Parallel 5.2 change edits `features.md`, `CHANGELOG.md` and maybe the same contract] → Separate
  bullets and a separate dated entry; merge conflicts are text appends.
- [Motion 300 → 250 ms] → See Decision; reversible in one line.

## Migration Plan

One PR, two commits: (1) the contract test seeded with the 5.1 files plus the screen and test
changes that make it pass (before writing the screen changes, run the contract once and record its
failures on the current residue in the PR body as the red half of the proof); (2) Architecture
Book, ADR 077 and CHANGELOG. Rollback is a revert.
