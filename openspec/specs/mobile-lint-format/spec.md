# mobile-lint-format Specification

## Purpose
The lint/format rules that gate hand-written mobile code (`mobile/eslint.config.js`). The authoritative, prose rule inventory lives in the Architecture Book "Lint & format"; this spec tracks requirements as they are added per change. (The scaffold-era rules from `add-mobile-lint-format` are documented in the Architecture Book but not yet promoted here — that change predates spec promotion.)

## Requirements

### Requirement: Import and export order is lint-enforced and autofixable
Lint SHALL enforce a canonical import (and export) order in hand-written mobile
code via `eslint-plugin-simple-import-sort`, reported as an error and repairable
by `eslint --fix`. The group order SHALL be: side-effect imports, then Node
builtins together with third-party packages, then the `@/` alias, then relative
imports. Generated code (`src/api/generated/**`) SHALL remain exempt, and
side-effect imports SHALL keep their relative order so import side effects are not
reordered.

#### Scenario: Misordered imports are blocked and fixable
- **WHEN** a file imports a relative module before a third-party package, or a
  `@/` alias import before a third-party package
- **THEN** `npm run lint` reports an error on the import block, and `eslint --fix`
  rewrites it into the canonical order

#### Scenario: The `@/` alias is its own group between third-party and relative
- **WHEN** a file mixes third-party, `@/` alias, and relative imports
- **THEN** the fixed order places third-party first, `@/` alias imports next, and
  relative imports last, each group separated by a blank line

#### Scenario: Side-effect imports keep their relative order
- **WHEN** a file contains a side-effect import such as `import "@/i18n"`
- **THEN** the rule does not reorder it relative to other side-effect imports
  (preserving import side-effect ordering)

#### Scenario: Generated code is exempt
- **WHEN** files under `src/api/generated/` have imports in a different order
- **THEN** the import-order rule reports no violations for those files

### Requirement: Feature-module import boundaries are lint-enforced
Lint SHALL enforce the layered feature-module import boundaries
([ADR 014](../../../../docs/mobile/architecture-book/decisions/014-layered-feature-module-pattern.md))
via `eslint-plugin-boundaries`, reported as errors and gated by the `test-mobile`
CI job. The boundaries lint SHALL be layered **on top of** the existing seam bans
(`no-restricted-imports` for the storage/chrome/axios seams, `no-restricted-globals`
for `fetch`), which remain unchanged. The boundary checks SHALL resolve the `@/`
alias (via `eslint-import-resolver-typescript`) so that import targets are
classified by their resolved file, not the literal specifier string. The following
four boundaries SHALL be enforced:

- **B-1** — only a feature's `data/` sublayer may import the generated API client
  (`@/api/generated/**`) or the `@/db` seam.
- **B-2** — a feature sublayer (`data/`/`store/`/`form/`/…) SHALL NOT import its own
  feature-level barrel (`@/features/<feature>`); it imports a sibling sublayer's
  sub-barrel directly.
- **B-3** — presentational screens (`src/components/**`) and routes (`src/app/**`)
  SHALL NOT import `@/api/generated/**` or the `@/db` seam directly; they consume a
  feature through its barrel.
- **B-4** — the documented infra→feature seam — `@/hooks/use-color-scheme` and
  `@/i18n` importing `@/features/settings/prefs` and `@/features/settings/prefs/store`
  ([ADR 009](../../../../docs/mobile/architecture-book/decisions/009-settings-feature-prefs.md))
  — SHALL be allowed.

The current mobile source tree SHALL already satisfy these boundaries (the rule
lands green; it adds the gate around compliant code).

#### Scenario: A screen reaching into the generated API or db seam is blocked
- **WHEN** a file under `src/components/**` or `src/app/**` imports from
  `@/api/generated/**` or `@/db`
- **THEN** `npm run lint` reports a `boundaries/dependencies` error naming the B-3
  boundary

#### Scenario: A non-`data` sublayer reaching the generated API or db seam is blocked
- **WHEN** a feature sublayer other than `data/` (e.g. `form/`, `store/`) imports
  from `@/api/generated/**` or `@/db`
- **THEN** `npm run lint` reports a `boundaries/dependencies` error naming the B-1
  boundary, while the same import from the feature's `data/` sublayer is allowed

#### Scenario: A sublayer importing its own feature barrel is blocked
- **WHEN** a file in `src/features/<feature>/<layer>/` imports the feature-level
  barrel `@/features/<feature>`
- **THEN** `npm run lint` reports a `boundaries/dependencies` error naming the B-2
  (cycle) boundary

#### Scenario: The documented infra→feature edge is allowed
- **WHEN** `@/hooks/use-color-scheme` imports `@/features/settings/prefs`, or
  `@/i18n` imports `@/features/settings/prefs/store`
- **THEN** `npm run lint` reports no boundaries violation for those imports

#### Scenario: The existing seam bans are unchanged
- **WHEN** the boundaries rule is added
- **THEN** the existing `no-restricted-imports` (storage/chrome/axios seams) and
  `no-restricted-globals` (`fetch`) rules continue to apply with their current
  options, and `npm run lint` (`--max-warnings 0`) stays green on the current tree

### Requirement: Mobile has an ESLint flat config based on eslint-config-expo
The mobile app SHALL have an ESLint 9 flat config at `mobile/eslint.config.js` extending `eslint-config-expo/flat`, and `npm run lint` in `mobile/` SHALL pass with zero errors and zero warnings on the committed tree.

#### Scenario: Lint passes clean on a fresh clone
- **WHEN** `npm ci && npm run lint` is executed in `mobile/`
- **THEN** lint exits 0 with no errors and no warnings

#### Scenario: Generated code is exempt from hand-written-code rules
- **WHEN** files under `mobile/src/api/generated/` would violate an architecture rule (strings, a11y, import restrictions)
- **THEN** lint reports no violations for those files, while they remain subject to formatting

### Requirement: Prettier configuration matches web and server
`mobile/.prettierrc` SHALL be identical in content to `web/.prettierrc` and `server/.prettierrc` (`singleQuote: false`, `trailingComma: "all"`, `semi: false`), the entire mobile tree SHALL be formatted accordingly, and formatting SHALL be enforced as a lint error via `eslint-plugin-prettier` (matching the web/server mechanism).

#### Scenario: Config files are aligned
- **WHEN** `mobile/.prettierrc` is compared to `web/.prettierrc` and `server/.prettierrc`
- **THEN** the formatting options are identical

#### Scenario: Format drift is a lint failure
- **WHEN** a mobile source file is committed with formatting that differs from the Prettier config
- **THEN** `npm run lint` reports an error on that file, and `eslint --fix` repairs it

#### Scenario: Generated client stays in sync with the new format
- **WHEN** `npm run generate` is executed in `mobile/` after the Prettier alignment
- **THEN** `git diff --exit-code src/api/generated` reports no drift

### Requirement: Hardcoded user-facing strings are a lint error
Lint SHALL report an error for hardcoded user-facing strings in JSX text and in user-facing props (at minimum `accessibilityLabel`, `accessibilityHint`, `placeholder`), with `testID` and other non-user-facing props exempt. Pre-existing template screens MAY carry file-level suppression comments tagged as debt to be removed by the i18n step.

#### Scenario: New JSX literal is blocked
- **WHEN** a component renders a hardcoded string such as `<Text>Settings</Text>` in a file without a suppression
- **THEN** lint reports an error on that string

#### Scenario: Suppressions are explicit and tagged
- **WHEN** a pre-existing template file contains hardcoded strings
- **THEN** the file carries a file-level `eslint-disable` comment for the strings rule with a marker referencing its planned removal

### Requirement: Touchable elements require accessibility props
Lint SHALL report an error when touchable/pressable elements lack required accessibility props (role and label coverage per the configured `eslint-plugin-react-native-a11y` rules).

#### Scenario: Touchable without accessibility props is blocked
- **WHEN** a `Pressable`/`TouchableOpacity` (or equivalent touchable) is rendered without the required accessibility props
- **THEN** lint reports an error on that element

### Requirement: Direct @react-navigation imports are banned
Lint SHALL report an error for any import from `@react-navigation/*` in hand-written mobile code, with a message directing to Expo Router.

#### Scenario: Direct navigation import is blocked
- **WHEN** a file imports from `@react-navigation/native` (or any `@react-navigation/*` package)
- **THEN** lint reports an error whose message names Expo Router as the required API

### Requirement: Import boundaries for the current layout are lint-enforced
Lint SHALL enforce: (1) no parent-relative imports (`../*`) — cross-directory imports use the `@/` alias; (2) files outside `src/app/` SHALL NOT import from `@/app/*` (route files are entrypoints, not modules); (3) no imports of `axios`.

#### Scenario: Parent-relative import is blocked
- **WHEN** a file imports via a `../` path
- **THEN** lint reports an error directing to the `@/` alias

#### Scenario: Route file imported as a module is blocked
- **WHEN** a file outside `src/app/` imports from `@/app/...`
- **THEN** lint reports an error

#### Scenario: axios is blocked
- **WHEN** a file imports `axios`
- **THEN** lint reports an error directing to the generated client

### Requirement: Raw fetch outside the mutator is a lint error
Lint SHALL report an error for use of the global `fetch` anywhere in hand-written mobile code except `src/api/mutator.ts`, closing the Architecture Book's R-1 debt on un-gated fetch calls.

#### Scenario: Raw fetch in a component is blocked
- **WHEN** a file other than `src/api/mutator.ts` calls the global `fetch`
- **THEN** lint reports an error directing to the generated API client

#### Scenario: The mutator may use fetch
- **WHEN** `src/api/mutator.ts` calls the global `fetch`
- **THEN** lint reports no violation

### Requirement: Pre-commit lints staged mobile files
`mobile/package.json` SHALL declare a `lint-staged` configuration running `eslint --cache --fix` on staged JS/TS files, picked up by the root pre-commit hook through lint-staged's nested-config discovery. The root hook SHALL carry no mobile-specific knowledge and no husky-version-specific preamble, and its contents SHALL be bounded to a `#!/bin/sh` shebang, `npx lint-staged`, and repository-wide guard invocations that each propagate their own failure explicitly (currently `./ci/check-commit-identity.sh || exit 1`, per the `agent-delivery-identity` capability). The hook SHALL invoke lint-staged through `npx` and SHALL be tracked with file mode `100755`, because those two properties are what make it run under either `core.hooksPath` value (git invokes it directly when the slot is `.husky`, and through husky's generated shim when the slot is `.husky/_`).

#### Scenario: Staged mobile file with a violation blocks the commit
- **WHEN** a mobile file containing an unfixable lint error is staged and `git commit` runs
- **THEN** the pre-commit hook fails and the commit is aborted

#### Scenario: Staged mobile file with a fixable violation is rewritten in place
- **WHEN** a `mobile/**/*.ts` file with an auto-fixable lint violation is staged and `git commit` runs
- **THEN** `eslint --cache --fix` rewrites the staged file and the commit proceeds with the fixed content

#### Scenario: The hook resolves lint-staged without husky's PATH injection
- **WHEN** the pre-commit hook runs under `core.hooksPath = .husky`, where git invokes the tracked hook directly and nothing has prepended `node_modules/.bin` to `PATH`
- **THEN** `npx` resolves lint-staged from `node_modules` and the mobile lint gate still runs — whereas a bare `lint-staged` invocation would fail with `command not found` and abort the commit

#### Scenario: The tracked hook stays executable
- **WHEN** the pre-commit hook is modified and `git ls-files -s .husky/pre-commit` is read
- **THEN** the mode is `100755` — a hook recorded as `100644` is silently ignored by git under `core.hooksPath = .husky`, so the commit succeeds unlinted with only a suppressible `advice.ignoredHook` hint

#### Scenario: The mobile lint gate still runs when a repository-wide guard passes
- **WHEN** a guard line ahead of `npx lint-staged` exits 0 — the case for every human commit and every correctly-identified agent commit
- **THEN** the hook continues to `npx lint-staged` unchanged, and mobile's nested lint-staged config is discovered exactly as before

### Requirement: CI gates mobile lint at zero warnings
The `test-mobile` CI job SHALL run mobile lint with `--max-warnings 0` and fail on any error or warning.

#### Scenario: Lint violation fails CI
- **WHEN** a commit introduces a mobile lint error or warning and CI runs
- **THEN** the `test-mobile` job fails at the lint step

### Requirement: The Architecture Book points to the enforcing rules
The Architecture Book SHALL gain a lint/format section recording the rule inventory (what each rule encodes and where it lives), and the data-layer section's prose caveat about un-gated `fetch` SHALL be replaced with a pointer to the enforcing lint rule (per R-1).

#### Scenario: Fetch caveat is resolved
- **WHEN** `docs/mobile/architecture-book/architecture.md` is read after this change
- **THEN** the data-layer section no longer describes the no-raw-fetch rule as un-encoded prose and instead points to the lint rule

#### Scenario: Rule inventory exists
- **WHEN** the Architecture Book's lint/format section is read
- **THEN** it lists the encoded rules (strings, a11y, navigation, boundaries, fetch, axios) with pointers to their enforcement

### Requirement: Device color-scheme reads are confined to the seam by lint
The lint configuration SHALL report an error when any file imports the `useColorScheme` or
`Appearance` binding from `react-native`, including through a namespace import or a re-export,
except in the `@/hooks/use-color-scheme` seam module. The ban SHALL apply in every file, including
the directories whose blocks re-set `no-restricted-imports` (storage, chrome, Activity, export-guide
and calendar-sources). The error message SHALL name the seam. Other `react-native` imports SHALL be
unaffected.

#### Scenario: Feature code imports the device hook
- **WHEN** a feature or component file adds `import { useColorScheme } from "react-native"`
- **THEN** `npm run lint` fails with a message pointing to `@/hooks/use-color-scheme`

#### Scenario: Appearance is banned in seam-override directories too
- **WHEN** a file under `src/components/chrome/` or `src/features/calendar-sources/` imports `Appearance` from `react-native`
- **THEN** `npm run lint` fails

#### Scenario: The seam module itself is allowed
- **WHEN** `src/hooks/use-color-scheme.ts` imports `useColorScheme` from `react-native`
- **THEN** lint passes

### Requirement: Disabling OS font scaling is a lint error
The lint configuration SHALL report an error for `allowFontScaling={false}` on any JSX element
and for an `allowFontScaling: false` object property (the spread-props form), in every linted
file with no exemption. Capping scale with `maxFontSizeMultiplier` SHALL remain allowed.

#### Scenario: A text element disables font scaling
- **WHEN** a component renders `<Text allowFontScaling={false}>`
- **THEN** `npm run lint` fails with a message stating that text must follow the OS font size

#### Scenario: Spread props disable font scaling
- **WHEN** a file defines an object literal with `allowFontScaling: false`
- **THEN** `npm run lint` fails

#### Scenario: A scale cap is allowed
- **WHEN** a component renders `<Text maxFontSizeMultiplier={1.3}>`
- **THEN** lint passes

### Requirement: Symbol icons render only through the icon primitive

Lint SHALL report an error for any import of the `SymbolView` component from `expo-symbols` outside the app's icon primitive module and its test, so every icon passes through the text-scaling contract. Type-only imports from `expo-symbols` (symbol name types) SHALL stay allowed.

#### Scenario: A feature imports SymbolView

- **WHEN** a file under `src/features/` imports `SymbolView` from `expo-symbols`
- **THEN** `npm run lint` fails with a message that points to the icon primitive

#### Scenario: Symbol name types stay importable

- **WHEN** a file imports the `SFSymbol` or `AndroidSymbol` type from `expo-symbols`
- **THEN** lint reports no error for that import

### Requirement: The device-zone-dependent offset function is a lint error

Lint SHALL report an error for every way a file under `mobile/src/` can reach `getTimezoneOffset` from `date-fns-tz`: a named or aliased import, a namespace import, a default import, a named or namespace re-export, and a dynamic `import()` of the module. That function reads a `Date`'s device-local fields as the zone's wall clock, so its result depends on the device zone. The message SHALL point to the app's instant-based zone-offset helper. Named imports of other `date-fns-tz` helpers and the device `Date`'s own offset method SHALL stay allowed. A test SHALL lint each form through the project's real lint configuration.

#### Scenario: A module imports getTimezoneOffset

- **WHEN** a file under `src/` imports `getTimezoneOffset` from `date-fns-tz`, under its own name or an alias
- **THEN** `npm run lint` fails with a message that names the instant-based offset helper

#### Scenario: A module reaches getTimezoneOffset through a namespace import

- **WHEN** a file under `src/` writes `import * as tz from "date-fns-tz"` and calls `tz.getTimezoneOffset(...)`
- **THEN** `npm run lint` fails on the import

#### Scenario: A module reaches date-fns-tz through a default import, a re-export or a dynamic import

- **WHEN** a file under `src/` default-imports `date-fns-tz`, re-exports `getTimezoneOffset` or the module namespace from it, or calls `import("date-fns-tz")`
- **THEN** `npm run lint` fails

#### Scenario: Other date-fns-tz helpers stay importable

- **WHEN** a file imports `formatInTimeZone`, `toZonedTime`, or `fromZonedTime` from `date-fns-tz`, or calls a `Date`'s own `getTimezoneOffset()`
- **THEN** lint reports no error for that code

### Requirement: Legacy React Native touchables and the RN Button are a lint error

Lint SHALL report an error for any named import of `Button`, `TouchableOpacity`,
`TouchableHighlight`, `TouchableWithoutFeedback` or `TouchableNativeFeedback` from `react-native`,
in every linted file, with a message that points to the shared button. `Pressable` SHALL stay
importable.

#### Scenario: A feature imports TouchableOpacity

- **WHEN** a file under `src/features/` imports `TouchableOpacity` from `react-native`
- **THEN** `npm run lint` fails with a message that names the shared button

#### Scenario: Pressable stays allowed

- **WHEN** a file imports `Pressable` from `react-native`
- **THEN** lint reports no error for that import

### Requirement: Text buttons built from a raw Pressable are a ratcheted lint error

Lint SHALL report an error for a React Native `Pressable` that declares the `button` or `link`
role and has a direct text child, in every source file except the shared button module, the
native-chrome seam, the calendar renderer and tests. Files that predate the shared button SHALL be
listed in one committed allowlist that lint skips. A test SHALL fail when an allowlisted file no
longer exists, when it no longer contains a violation, or when the list is longer than its pinned
ceiling, so the list can only shrink.

#### Scenario: A new screen hand-rolls a text button

- **WHEN** a file not on the allowlist renders `<Pressable accessibilityRole="button"><ThemedText>Save</ThemedText></Pressable>`
- **THEN** `npm run lint` fails with a message that points to the shared button

#### Scenario: A row that wraps its text in a layout view is not flagged

- **WHEN** a `Pressable` with the `button` role contains a `View` that contains the text
- **THEN** the rule reports nothing for it

#### Scenario: A migrated file leaves the allowlist

- **WHEN** a file on the allowlist is migrated and no longer contains a violation, but stays listed
- **THEN** the allowlist test fails and names the stale entry

#### Scenario: The allowlist cannot grow silently

- **WHEN** an entry is added to the allowlist without raising the pinned ceiling
- **THEN** the allowlist test fails

### Requirement: Ad-hoc status UI is a ratcheted lint error

Lint SHALL report an error for importing React Native's `ActivityIndicator`, and for a list's
`ListEmptyComponent` that renders anything other than the shared status view (looking through
conditional and logical expressions; `null` passes), in every source file except the design layer,
the native-chrome seam, the calendar renderer and tests. Files not yet migrated SHALL be listed in
one committed allowlist that lint skips. A test SHALL fail when an allowlisted file no longer
exists, when it no longer contains a violation, when it is listed twice, or when the list is longer
than its pinned ceiling, so the list can only shrink.

#### Scenario: A new screen hand-rolls a spinner

- **WHEN** a feature file not on the allowlist imports `ActivityIndicator` from `react-native`
- **THEN** `npm run lint` fails with a message that points to the shared status view

#### Scenario: A list renders a plain-text empty slot

- **WHEN** a feature file not on the allowlist passes `ListEmptyComponent={<ThemedText>…</ThemedText>}`
- **THEN** `npm run lint` fails

#### Scenario: A conditional empty slot of status views passes

- **WHEN** `ListEmptyComponent` is `isLoading ? <StatusView kind="loading" … /> : <StatusView kind="empty" … />`
- **THEN** the rule reports nothing

#### Scenario: A migrated file leaves the allowlist

- **WHEN** an allowlisted file is migrated and no longer contains a violation, but stays listed
- **THEN** the allowlist test fails and names the stale entry

### Requirement: Web-only described-by relations are a lint error

Lint SHALL report an error for an `aria-describedby` JSX attribute in every source file, tests
included, with a message that points to folding the description into the field's accessibility
hint, because React Native forwards no described-by relation to iOS or Android views.

#### Scenario: A field links its error by id

- **WHEN** a file renders `<TextInput aria-describedby="email-error" />`
- **THEN** `npm run lint` fails

### Requirement: Raw text inputs are a ratcheted lint error

Lint SHALL report an error for a value import of React Native's `TextInput` (aliases included) in
every source file except the design layer and tests; a type-only import SHALL pass. Files not yet
migrated SHALL be listed in one committed allowlist that lint skips. A test SHALL fail when an
allowlisted file no longer exists, when it no longer contains a violation, when it is listed twice,
or when the list is longer than its pinned ceiling, so the list can only shrink.

#### Scenario: A new screen renders a raw input

- **WHEN** a feature file not on the allowlist imports `TextInput` from `react-native`
- **THEN** `npm run lint` fails with a message that points to the shared text field

#### Scenario: A ref type import passes

- **WHEN** a feature file writes `import type { TextInput } from "react-native"`
- **THEN** the rule reports nothing

#### Scenario: A migrated file leaves the allowlist

- **WHEN** an allowlisted file is migrated and no longer imports `TextInput`, but stays listed
- **THEN** the allowlist test fails and names the stale entry

### Requirement: SwiftUI container nodes carry no accessibility identifier

Lint SHALL report an error when a file under `mobile/src/` sets an accessibility identifier on an `@expo/ui/swift-ui` container node, whether through its `testID` prop or an `accessibilityIdentifier` modifier, however the component and the modifier are imported or aliased. Container nodes are the layout and grouping views that are not accessibility elements themselves: `BottomSheet`, `ControlGroup`, `DisclosureGroup`, `Form`, `GlassEffectContainer`, `Grid`, `Group`, `HStack`, `LazyHStack`, `LazyVStack`, `List`, `Mask`, `Namespace`, `Overlay`, `ScrollView`, `Section`, `TabView`, `VStack` and `ZStack`. The SwiftUI `Host` SHALL NOT carry an `accessibilityIdentifier` modifier; its `testID` stays allowed because it identifies the UIKit hosting view. Identifiers on leaf elements and controls SHALL stay allowed. The Jest SwiftUI mock SHALL fail a render that passes an identifier to a container node, so a spread prop that lint cannot see still fails a test.

#### Scenario: A Section receives an identifier modifier

- **WHEN** a chrome file renders `<Section modifiers={[accessibilityIdentifier("x")]}>`, under any import alias
- **THEN** `npm run lint` fails with a message that explains the identifier cascades onto the children

#### Scenario: A VStack receives a testID

- **WHEN** a chrome file renders an `@expo/ui/swift-ui` `VStack` with a `testID` prop
- **THEN** `npm run lint` fails

#### Scenario: A conditional modifier spread hides the identifier

- **WHEN** a container's modifiers array spreads a conditional or a local constant that contains an `accessibilityIdentifier` call
- **THEN** `npm run lint` fails

#### Scenario: Leaves and the Host testID stay allowed

- **WHEN** a `Button`, `Text`, `TextField`, `Toggle`, `LabeledContent` or `ProgressView` carries an identifier, or a `Host` carries a `testID`
- **THEN** lint reports no error

#### Scenario: A spread prop reaches a container under Jest

- **WHEN** a component under test passes an identifier to a SwiftUI container through a spread the lint rule cannot follow
- **THEN** the render throws in the test and names the container

### Requirement: Hand-drawn hairline separators are a ratcheted lint error

Lint SHALL report an error for a style property `borderBottomWidth`, `borderTopWidth` or `height`
whose value is `StyleSheet.hairlineWidth`, in every source file except the design layer, the theme
module, the calendar renderer and tests. Files not yet migrated SHALL be listed in one committed
allowlist that lint skips. A test SHALL fail when an allowlisted file no longer exists, when it no
longer contains a violation, when it is listed twice, or when the list is longer than its pinned
ceiling, so the list can only shrink. A hairline `borderWidth` (an outline ring) SHALL NOT be
reported.

#### Scenario: A new screen draws its own row separator

- **WHEN** a feature file not on the allowlist styles a row with `borderBottomWidth:
  StyleSheet.hairlineWidth`
- **THEN** `npm run lint` fails with a message that points to the shared separator

#### Scenario: A hairline ring passes

- **WHEN** a feature file styles a logo with `borderWidth: StyleSheet.hairlineWidth`
- **THEN** the rule reports nothing

#### Scenario: A migrated file leaves the allowlist

- **WHEN** an allowlisted file no longer draws a hairline separator but stays listed
- **THEN** the allowlist test fails and names the stale entry

### Requirement: Raw event-color fills are a ratcheted lint error

Lint SHALL report an error for a `backgroundColor`, `borderColor` or per-side border color
(`borderLeftColor`, `borderRightColor`, `borderTopColor`, `borderBottomColor`, `borderStartColor`,
`borderEndColor`) style value read directly from a `color` member of a data object (such as an
event's or a tag's color), and for a direct call to the event appearance resolver, in every React
component source file except the design layer, the theme module, the calendar renderer and tests. A
value read from the theme SHALL NOT be reported. Files not yet migrated SHALL be listed in one
committed allowlist that lint skips, each annotated with the slice that migrates it. A test SHALL
fail when an allowlisted file no longer exists, when it no longer contains a violation, when it is
listed twice, or when the list is longer than its pinned ceiling of one, so the list can only shrink.

#### Scenario: A new screen fills a view with an event color

- **WHEN** a feature file not on the allowlist styles a view with `backgroundColor: event.color`
- **THEN** `npm run lint` fails with a message that points to the shared color dot and event surface

#### Scenario: A feature tile draws a raw-color stripe

- **WHEN** a feature file not on the allowlist styles a view with `borderLeftColor: event.color`
- **THEN** `npm run lint` fails

#### Scenario: A feature tile resolves its own appearance

- **WHEN** a feature component calls `resolveEventAppearance` to color a tile
- **THEN** `npm run lint` fails with a message that points to the event surface

#### Scenario: A theme color passes

- **WHEN** a feature file styles a view with `backgroundColor: theme.backgroundElement` or
  `borderLeftColor: theme.primary`
- **THEN** the rule reports nothing

#### Scenario: A data object key passes

- **WHEN** a data mapper writes `{ color: row.color }`
- **THEN** the rule reports nothing

#### Scenario: A migrated file leaves the allowlist

- **WHEN** an allowlisted file no longer fills a view with a raw event color but stays listed
- **THEN** the allowlist test fails and names the stale entry

### Requirement: Hand-built header actions are a ratcheted lint error

Lint SHALL report an error, outside the native-chrome seam and tests, for an object property named
`headerRight`, `headerLeft`, `unstable_headerRightItems` or `unstable_headerLeftItems`, and for a
`Stack.Toolbar` element whose `placement` is not the literal `"bottom"`. Files that keep a custom
header element until a later slice SHALL be listed in one committed allowlist that lint skips. A
test SHALL fail when an allowlisted file no longer exists, when it no longer contains a violation,
or when the list is longer than its pinned ceiling.

#### Scenario: A screen hand-rolls a header button

- **WHEN** a feature file sets `headerRight: () => <Pressable … />` in its screen options
- **THEN** `npm run lint` fails with a message that points to `useHeaderActions`

#### Scenario: The bottom toolbar is allowed

- **WHEN** the timezone chooser renders `<Stack.Toolbar placement="bottom">` with the search slot
- **THEN** the rule reports nothing for it

#### Scenario: The allowlist cannot grow silently

- **WHEN** an entry is added to the header-action allowlist without raising the pinned ceiling
- **THEN** the allowlist test fails
