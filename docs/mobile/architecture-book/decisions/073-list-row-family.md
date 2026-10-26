# 073 — List row family and Android row semantics

## Status

Accepted.

## Context

TalkBack heard an Android `NativeListRow` as its visible text with no role and no hint. Expo UI
56.0.17's Compose modifiers cannot say more: `clickable` takes no role or click label,
`semantics` sets only `contentType`, and `selectable`/`toggleable` accept only radio, checkbox,
switch and tab roles. No modifier sets a content description. Expo UI's Android
`ModifierRegistry` does accept app-registered modifier types, and its JS side forwards any
`{ $type, …params }` object. The Jest mock projected every `clickable` as a button, so CI passed
rows that TalkBack meets without a role.

Eight lists the native seam cannot host (virtualized, hundreds of rows, caller elements) were
hand-built: their own padding, corners, separators, press feedback and accessible names, each
slightly different from the seam and from each other.

## Decision

- **Android row semantics through a local module.** `mobile/modules/compose-semantics`
  (Android only, autolinked) registers the modifier `timecalendarSemantics` with
  `ModifierRegistry.register` in `OnCreate` and unregisters it in `OnDestroy`. It returns
  `Modifier.clearAndSetSemantics { contentDescription; role = Role.Button when asked }`.
  `src/components/chrome/compose-semantics.ts` is the only place that names the type.
  `ComposeListRow` appends it last, so it clears `ListItem`'s own text while the `testID` tag and
  the click action outside it survive. The description is the row's name, then its value, then
  its badge, then its hint, joined with ", " by `joinRowName` (`src/design/list/row-name.ts`, shared
  with `ListRow`); navigation and action rows add the button role, value rows do not. The iOS row's
  accessibility label is its name then its badge.
- **The mock tells the truth.** `jest/setup-expo-ui.ts` derives a role only from `selectable`,
  `toggleable` and `timecalendarSemantics`.
- **One RN row family.** `ListRow`, `ListSection` and `Separator` in `src/design/list/`. The props
  union separates action rows (`onPress` or `href`, `hint`, `selected`, `disabled`, a chevron)
  from static rows (one accessory element), takes no color, height or font prop, and requires a
  `testID`. Names follow the seam (`label`, `subtitle`, `value`).
- **One geometry source.** `ListGeometry` in `@/theme` holds the row padding, minimum heights,
  icon sizes, grouped corners and the Android segment gap and inset; `native-list.tsx` reads the
  same tokens.
- **Colors from the seam's own derivation.** `useListPalette()` returns theme tokens on iOS and,
  on Android, Expo UI's `getMaterialColors` seeded with `primary`, the call every Compose host
  makes, cached per scheme and seed.
- **Grouped vs plain.** A row in a `ListSection` or with an explicit `position` is grouped and
  draws its own surface, corners, iOS separator and Android gap. A plain row's list passes
  `ListRowSeparator`, which renders an inset `Separator` on iOS and nothing on Android.
- **Separator ratchet, no row lint.** `local/no-ad-hoc-separator` bans
  `StyleSheet.hairlineWidth` borders and heights outside `src/design/`, with a one-entry
  allowlist (the Home timeline).

Rejected:

- `patch-package` on `@expo/ui`: a patch on an alpha package that every bump re-applies, when the
  registry is an extension point.
- The hint as `onClick(label)`: TalkBack says "Double-tap to <label>", ungrammatical with the
  app's shared sentence-form hints.
- The value as `stateDescription`: TalkBack reads it after the hint, away from the name.
- `Modifier.semantics` without clearing: whether TalkBack also reads the merged child text varies
  by version.
- A sampled `listSurface` token pair: constants that drift when the seed or Expo UI's scheme
  variant changes.
- `title` for the row's main text: a second name for the seam's `label`.
- A raw-number separator inset: call-site geometry that drifts from `ListGeometry`.
- A lint rule for hand-built rows: a `Pressable` with a label and chevron has no reliable static
  signature.

## Consequences

- Maestro flow 03 asserts the user-calendar row's description on Android, the device proof that
  the module loads and the modifier applies. The Kotlin compiles only in the Android native build
  (CI E2E or a Windows host), not in Jest.
- `ModifierRegistry` is undocumented API; an `@expo/ui` bump re-checks it.
- The registry a11y check reports any bare `clickable`; `ComposeListRow` is its only user.
- The dormant school-group picker keeps its own tree rows: its expand/collapse state has no other
  user, and the route is slated for removal.
- Rendered geometry, colors and screen-reader announcements are device evidence
  (`docs/react-native-migration/inbox/2026-10-26-mobile-ds-list-row-device-pass.md`).

## Revisit if

- Expo UI ships a role, content-description or click-label modifier: use it and delete
  `modules/compose-semantics`.
- The seam's row and `ListRow` converge enough to share one implementation.
- The `list-section--seam-comparison` device check shows a corner or color mismatch: edit the
  `ListGeometry` token.
