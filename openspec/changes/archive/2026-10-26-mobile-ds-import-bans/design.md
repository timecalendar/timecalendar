# Design

## Context

See proposal.md → Why. The relevant current state, read from `mobile/` on `origin/main` (0242ab41):

- **L2, design half, already exists.** `designDeepImportPattern` (`^@/design/(?!gallery(/|$))`,
  `eslint.config.js:216-220`) and `galleryEntryImportPattern` (`:222-226`) are flags of
  `restrictedImports` (`:306-348`); `design-home`, `design-tests`, `design-fixtures`,
  `chrome-seams`, `chrome-fixtures`, `icon-seam` and `developer-tools-home` lift them where
  needed (`:479-671`). `tools/eslint-rules/design-import-policy.test.js` pins the effective
  options per file class. Nothing bans `@/components/chrome/<file>` or `@/components/app-tabs`.
- **L3 is mostly encoded, in three different gates:**
  - `rawTouchablesImportPath` (`:247-257`): `Button`, `TouchableOpacity`, `TouchableHighlight`,
    `TouchableWithoutFeedback`, `TouchableNativeFeedback`, every file, no exemption.
  - `local/no-raw-text-input` (`tools/eslint-rules/no-raw-text-input.js`, block `:949-960`):
    `TextInput`, all `src/**/*.tsx` but design and tests; allowlist ceiling 1.
  - `local/no-ad-hoc-status` (`no-ad-hoc-status.js`, block `:883-900`): `ActivityIndicator`
    plus hand-built `ListEmptyComponent`; one allowlist (ceiling 2) for both checks.
  - `Text` and `Modal` are not gated anywhere.
- **L4 is mostly encoded.** `symbolViewImportPath` (`:236-243`) bans the named `SymbolView` import;
  `icon-seam` (`:656-671`) lifts it for `src/design/icon/icon{,.test}.tsx`. `expo-symbols` also
  exports `unstable_getMaterialSymbolSourceAsync` and the sub-path `./androidWeights/*`
  (`node_modules/expo-symbols/build/index.d.ts:3`, `package.json` `exports`), neither banned.
- **4.1 ratchet mechanics** (ADR 077): a local rule with one boolean option and one message id per
  category; `style-literal-allowlist.js` holds `{ path, categories }` with a slice comment per
  entry; `eslint.config.js:984-1004` maps each entry to a block that turns off only those
  categories; `style-literal-allowlist.test.js` lints listed files with every category on and
  pins an exact per-category ceiling.
- `src/components/` holds only `app-tabs`, `chrome/` and two contract tests
  (`src/components/shell.contract.test.ts`).

### Offender census

Generated with the ESLint API over the current tree (core `no-restricted-imports` probes with the
patterns below; tests excluded where the rule's scope excludes them):

| Gate | Probe | Offenders |
| --- | --- | --- |
| L2 chrome deep | `^@/components/chrome/` outside `src/design/**`, `src/components/**` | 0 |
| L2 app shell | `^@/components/(?!chrome(/|$))` outside `src/components/**` | 1: `src/app/(tabs)/_layout.tsx:1` (a route; exempt by D3) |
| L2 design deep | `^@/design/(?!gallery(/|$))` outside design, components | 0 (already enforced) |
| L3 `Text` | `src/features/*/ui/**`, non-test | 1: `src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx:9` |
| L3 `Modal` | same | 0 (`owned-calendar-chooser.tsx` is under `renderer/`, out of scope) |
| L3 `TextInput` | same | 1 file, `event-checklists/ui/event-checklist.tsx` (already on `raw-text-input-allowlist.js`, 5.8) |
| L3 `ActivityIndicator` | same | 2 files, `activity/ui/activity-screen.tsx`, `calendar-sources/ui/dev-import-screen.tsx` (already on `ad-hoc-status-allowlist.js`, 5.4 and 5.7) |
| L3 `Button`/touchables | same | 0 (already banned everywhere) |
| L4 | `SymbolView`, `unstable_getMaterialSymbolSourceAsync`, `^expo-symbols/` outside the icon seam and chrome | 0 |

`src/design/**` and `src/components/chrome/**` have no offender under any new ban.

## Goals / Non-Goals

**Goals:**

- Every L2–L4 name in the proposal table is reported in its scope by exactly one gate.
- New ratcheted entries follow 4.1's per-file, per-category, exact-ceiling shape.
- The new `no-restricted-imports` patterns are pinned per file class by the existing policy test.

**Non-Goals:**

- Folding `local/no-raw-text-input`, the `ActivityIndicator` half of `local/no-ad-hoc-status` or
  `rawTouchablesImportPath` into the new rule (D1).
- Migrating `calendar-screen-header.tsx` (its title holds a focus ref and heading semantics; it is
  5.10 work, as its `style-literal-allowlist.js` entry already says).
- Banning namespace imports (`import * as RN`) or `require` (same static-import caveat as the
  sibling rules; no file does it today).

## Decisions

### D1. L3: keep the existing gates; a new local rule covers `Text` and `Modal` only

The three existing gates already cover `TextInput`, `ActivityIndicator`, `Button` and the
touchables in a scope that contains `src/features/*/ui/**`, each with a message naming its
replacement. Folding them into one L3 rule would either narrow their scope to `ui/` (losing the
`TextInput` ban in routes, hooks and non-chrome components, and the touchable ban everywhere) or
widen L3 beyond the proposal; and `no-ad-hoc-status` would have to split its one allowlist, since
its `ActivityIndicator` and `ListEmptyComponent` checks share entries. The new rule therefore
covers only the two names nothing gates today. No import is reported twice and no name has two
allowlists.

Alternatives: one rule for all seven names with the old rules retired (more churn, scope
regressions above); adding `Text`/`Modal` to the existing `react-native` `paths` entry (cannot be
allowlisted per file and per name without per-file `restrictedImports` blocks, D2).

### D2. Mechanism: a local rule with per-category options, not `no-restricted-imports`

`no-restricted-imports` cannot skip one name for one file except through a per-file block that
re-calls `restrictedImports(...)` with that file's whole flag set. Those blocks would have to
restate every seam flag of whatever directory the file sits in (developer, environment,
calendar-sources each differ), the exact silent-drop hazard lint-format.md warns about. A local
rule in its own block does not share that option slot, so 4.1's per-entry block can set only its
own options:

- `local/no-raw-primitive` (`tools/eslint-rules/no-raw-primitive.js`), schema
  `{ text: boolean, modal: boolean }`, both default `true`, `additionalProperties: false`.
- Message ids `rawText` (→ `ThemedText` from `@/design`) and `rawModal` (→ a Router route with a
  sheet or modal presentation, or `MenuView` from `@/components/chrome`).
- Reports an `ImportSpecifier` of `Text`/`Modal` from `"react-native"` (by `imported` name, so
  aliases count), skipping `import type` declarations and `type` specifiers; and an
  `ExportSpecifier` re-exporting them from `"react-native"`, skipping `export type`.
- Block `timecalendar/raw-primitive`, `files: ["src/features/*/ui/**/*.{ts,tsx}"]`, ignores
  `**/*.test.{ts,tsx}`, both options on. The calendar renderer (`src/features/calendar/renderer/`)
  is not under `ui/`, so it needs no ignore.
- `tools/eslint-rules/raw-primitive-allowlist.js` exports `rawPrimitiveAllowlist`
  (`{ path, categories }`, categories are message ids, trailing slice comment) and
  `rawPrimitiveCategoryOption` (`{ rawText: "text", rawModal: "modal" }`). One
  `timecalendar/raw-primitive-allowlist` block per entry, mapped after the base block, sets the
  listed categories to `false`.
- `raw-primitive-allowlist.test.js` mirrors `style-literal-allowlist.test.js`:
  `RAW_PRIMITIVE_ALLOWLIST_CEILING = { rawText: 1, rawModal: 0 }` (exact), keys equal the
  category map, each path once, each path exists, each category known, each listed category still
  reported in that file.

Generated allowlist (one entry):
`{ path: "src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx", categories: ["rawText"] }, // 5.10`

Alternative: a single `local/no-raw-primitive` whole-file allowlist spread into `ignores` (the
older sibling pattern). Rejected for the reason ADR 077 records: a file listed for `Text` could add
a `Modal`.

### D3. L2: two patterns, two flags; routes may compose the app shell

`no-restricted-imports` is the right tool here: both bans have zero offenders, so they need no
allowlist and stay in the shared `restrictedImports` slot with the design patterns.

- `chromeDeepImportPattern`: `^@/components/chrome/`, flag `banChromeDeepImports` (default on).
  Message: import the native chrome seam through the `@/components/chrome` barrel.
- `appShellImportPattern`: `^@/components/(?!chrome(/|$))`, flag `banAppShellImports` (default
  on). Message: `src/components/` outside chrome is the app shell, composed by routes; shared UI
  comes from `@/design` or `@/components/chrome`.

Lifts:

| Block | `banChromeDeepImports` | `banAppShellImports` |
| --- | --- | --- |
| `design-home`, `design-tests`, `design-fixtures`, `icon-seam` | `false` | on |
| `components-home` (new, `src/components/**`, before `chrome-seams`) | `false` | `false` |
| `chrome-seams`, `chrome-fixtures` | `false` | on |
| `routes-shell` (new, `src/app/**`) | on | `false` |
| every other block | on | on |

`components-home` re-calls `restrictedImports([routeEntrypointImportPattern], …)` because
`routes-not-importable` matches `src/components/**`. `routes-shell` re-calls `restrictedImports([],
…)` without the route pattern, because routes may import `@/app`. No later block matches
`src/app/**` (the `fixtures` glob is `*.gallery.tsx`; no route is one).

Why routes and not an allowlist: the tabs layout importing `AppTabs` is the shell's intended
composition, not debt with a migrating slice; an allowlist entry with no slice would never leave.
Why two patterns rather than one `^@/components/(?!chrome$)`: a single pattern lifted for routes
would also let routes deep-import chrome. Why the design layer lifts chrome-deep: the proposal
exempts `src/design/**` (row L2); the gallery registry imports chrome fixtures by path today, and
a design primitive may need a chrome leaf to avoid a require cycle through the chrome barrel,
mirroring chrome's leaf access to design (ADR 068).

### D4. L4: complete the existing ban; the Icon primitive and chrome are exempt

Extend `symbolViewImportPath.importNames` to `["SymbolView",
"unstable_getMaterialSymbolSourceAsync"]` and add `symbolsDeepImportPattern`
(`^expo-symbols/`, same message) under the existing `banSymbolView` flag. Type imports stay
allowed (`importNames` names only values; the deep pattern has no type-only users: `icon.tsx` is
the one `androidWeights` importer).

Two lifts, per the audit table (design-system-proposal row L4) and the owner brief: `icon-seam`
(the `Icon` primitive, `src/design/icon/icon{,.test}.tsx`) and the native chrome seam
(`chrome-seams` and `chrome-fixtures`, `src/components/chrome/**`). Chrome wraps platform APIs
whose own symbol rendering (SwiftUI `Image(systemName:)` through `@expo/ui`, tab and menu
glyphs) sits next to `SymbolView` at the same native level; a chrome wrapper that needs a raw
symbol view takes on the text-scaling contract of accessibility.md → Icon scaling itself. No
chrome file imports `SymbolView` today. Every other directory, the rest of `src/design/**`
included, renders symbols through `Icon`.

### D5. Proof

- RuleTester suite `no-raw-primitive.test.js` (pattern `no-raw-text-input.test.js`):
  valid — `import { View } from "react-native"`, `import type { Text } from "react-native"`,
  `import { type Modal } from "react-native"`, `import { Text } from "react-native-paper"`,
  `export type { Text } from "react-native"`, `Text` with `{ text: false }`, `Modal` with
  `{ modal: false }`; invalid — `Text` (`rawText`), `Text as RNText`, `Modal` (`rawModal`),
  both in one declaration (two reports), `export { Text } from "react-native"`, default options.
  ≥ 90% branches on the rule file.
- `raw-primitive-allowlist.test.js` (D2).
- `design-import-policy.test.js`: add `chromeDeep`, `appShell` and `symbolsDeep` columns and file
  classes for `src/app/(tabs)/_layout.tsx`, `src/components/app-tabs.tsx`,
  `src/components/app-tabs.test.tsx`, `src/components/chrome/native-list.test.tsx`, a
  calendar-sources feature file, and `src/features/developer/ui/gallery-story-screen.tsx`; extend
  the `expo-symbols` path assertion to both import names.
- Inject-and-revert (tasks 3.x) for each new pattern and category.

### D6. ADR: extend 077 in place, no new ADR

Roadmap ADR "E" is "Visual-style lint ratchet (`local/no-style-literals`, raw-primitive bans)", one
decision. The import bans reuse its ratchet mechanics, so 077 gains the 4.2 decisions (D1–D4) in
its Decision, Rejected, Consequences and Revisit sections, written as current state. The
`decisions/README.md` row text widens to name the import bans. No number is consumed.

## Decision

**Raw-primitive and import bans extend the visual-style ratchet (ADR 077).**

- `Text` and `Modal` in feature `ui/` are a local rule with per-primitive options and a
  per-file, per-category allowlist pinned by exact ceilings, exactly like the style-literal
  categories.
- `TextInput`, `ActivityIndicator`, `Button` and the touchables stay with their existing gates;
  each name is gated once.
- The chrome seam is reached only through its barrel; the app shell only from routes and
  `src/components/`; both are `restrictedImports` flags pinned by the design import-policy test.
- `expo-symbols` values and sub-paths are reachable only from the `Icon` primitive and the native
  chrome seam.

Rejected: one fold-everything L3 rule (scope regressions, a split allowlist); `no-restricted-imports`
per-file allowlist blocks (must restate every seam flag per directory, the silent-drop hazard);
an allowlist entry for the tabs route (permanent, no migrating slice); banning `SymbolView` in
chrome (the seam wraps native APIs at the same level and owns their text scaling).

Revisit if: the `Text`/`Modal` allowlist reaches zero (drop its per-file block machinery); a
chrome wrapper renders a symbol that does not follow the OS text size; `src/components/` gains a second shell module
that features legitimately need.

## Risks / Trade-offs

- [A future block that sets `no-restricted-imports` forgets a new flag] → the policy test pins
  both flags per file class; the lint-format caveat already requires re-calling
  `restrictedImports`.
- [`ThemedText` may not fit the calendar header's focus ref yet] → the file stays allowlisted
  for 5.10; this change migrates nothing.
- [Namespace import or `require` evades the rule] → same static-import caveat as the siblings;
  review.
- [The `Modal` message points at two replacements] → both exist today (Router sheet routes in
  navigation.md, `MenuView` in the chrome barrel); a dedicated sheet primitive, if one lands,
  updates the message.

## Migration Plan

Two commits on `feat/mobile-ds-import-bans`: (1) rule, RuleTester suite, allowlist, allowlist
test, config wiring for L2–L4, policy-test extension; (2) Architecture Book (lint-format.md,
ADR 077, README row, CHANGELOG). Rollback is a revert; no runtime code changes.
