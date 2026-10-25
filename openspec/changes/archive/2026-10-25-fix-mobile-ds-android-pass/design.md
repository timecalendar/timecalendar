## Context

The five fixes are independent. See proposal.md for the device evidence. These code facts shape
the approach:

- `NativeSettingsHost` (`chrome/native-settings.tsx`) is a full-screen native host: SwiftUI
  `Host` + `Form` on iOS, Compose `Host` + `LazyColumn` on Android. `NativeSettingsRadioDialog`
  mounts its own `ComposeSettingsHost matchContents` around an `@expo/ui` `AlertDialog`, and it
  renders `null` on iOS. `NativeSettingsNumericEditor` (Android: `ComposeHost` + `AlertDialog`; iOS:
  a full `SwiftHost` form) and `NativeTextEntryDialog` (Android: Compose `Host` + `AlertDialog`;
  iOS: a SwiftUI sheet) are also standalone native hosts.
- Every current call site of those three primitives renders them after `</NativeSettingsHost>`
  (appearance, notification settings, settings gallery, user calendar detail), except
  `EnvironmentSettingsControl`. That control is mounted inside a `NativeSettingsSection` in
  `developer-screen.tsx` and returns `<>row + dialog</>`. On device, only the nested dialog
  misbehaves: Cancel does nothing, input is dead, and its window outlives a JS reload.
- React context crosses `@expo/ui` hosts, because the hosts are ordinary React components that
  render their children. A provider in `NativeSettingsHost` is therefore visible to anything in its
  subtree, including a feature component that sits several files away.
- `developer-screen.test.tsx` mocks `EnvironmentSettingsControl` to a stub. That is why no test
  rendered the bad nesting.
- `ThemedText` sets `accessibilityRole="header"` from the ramp step (`headingRole`), so a local
  `style` with `fontSize`/`fontWeight` gives no role. `EmptyState` titles use `type="subtitle"`,
  which resolves to `sectionTitle`.
- On Android, React Native maps `accessibilityLabel` to the focusable node's `contentDescription`,
  and TalkBack reads that instead of the descendant text. The uiautomator tree showed a Button with
  content-desc "Starts" and the value only as a child.
- The school list uses `RootPage lane="fullBleed"` (gutter 0) and supplies its own row insets.
  `ListStatus` pads itself with `Spacing.four` / `Spacing.five`, and `ErrorState` does not. The
  group picker uses `lane="standard"`, whose gutter is `Spacing.four`.

## Goals / Non-Goals

**Goals:**

- A Jest test that runs in the CI `test-mobile` gate (`TZ=UTC npm test -- --coverage`, 90%
  per-file branches) makes each corrected behavior observable.
- Misplacing a standalone native dialog inside a native settings host fails in tests and in dev,
  whichever file the dialog lives in.

**Non-Goals:**

- No icon-scaling policy, 12/24h field format, `Alert` restyling or event-details layout change.
  These are recorded in the inbox.
- No type-ramp or ADR 063 change. The device pass confirmed the Android weights.
- No style-literal lint for local typography overrides. That is roadmap phase 4.1
  (`local/no-style-literals`).

## Decisions

### Decision 1: Split the environment control into a selector hook, a row and a dialog

`features/environment/ui` exports `useEnvironmentSelector()`, which owns `capability`, `current`,
`switching`, `pickerOpen`, `choose()`, `select(target)`, `dismiss()` and the existing `confirm`
Alert. It also exports two presentational components that take that controller:
`EnvironmentSettingsRow` (the existing `SettingsRow`) and `EnvironmentSelectorDialog` (the existing
`NativeSettingsRadioDialog` props). Both return `null` for the production capability.
`DeveloperScreen` calls the hook once and takes its production redirect from the controller's
`capability`. It renders the row in the backend section and the dialog as a sibling after
`</NativeSettingsHost>`, next to the token `NativeTextEntryDialog`, which is the same shape as
`appearance-settings-screen.tsx` and `notification-settings-screen.tsx`.
`EnvironmentSettingsControl` is deleted, and the barrel exports the three new names. The
`banDeveloperTools` lint ban (`eslint.config.js`) names the three exports, so the selector stays
mountable only from `src/features/developer/**` and `src/features/environment/**`.

Alternatives considered:

- _A hook that returns `{ row, dialog }` elements_: it works, but a hook that returns JSX is
  harder to test and type. Controller plus presentational components is the pattern the
  notifications screen already uses.
- _A portal from inside the section to outside the host_: React Native has no first-party portal,
  and adding one is a new dependency for one control.
- _Keep the control and render the dialog through a module-level store_: this hides the placement
  in global state, which is the same fault in another form.

### Decision 2: Encode "no standalone native dialog inside a native settings host" as a context invariant

`chrome/` gains a private `NativeSettingsHostContext` (default `false`). `NativeSettingsHost`
wraps its children in a provider with the value `true` on both platforms. A private
`useAssertOutsideNativeSettingsHost(componentName)` hook reads the context and throws
`Error("<componentName> must render outside NativeSettingsHost; place it after </NativeSettingsHost>.")`
when the value is `true`. `NativeSettingsRadioDialog`, `NativeSettingsNumericEditor` and
`NativeTextEntryDialog` call it unconditionally on their first line, before any `visible` or
platform early return. A closed or iOS radio dialog placed inside a host still fails on its first
render.

The throw is unconditional, not wrapped in `__DEV__`:

- Placement is static. It does not depend on data, so the first dev or test render of the screen
  hits it, long before a build ships.
- The misplaced state the throw prevents is itself app-bricking (an orphaned window that needs a
  force-stop), so a render error is not a worse failure.
- A `__DEV__`-only branch would leave a production branch that Jest cannot cover against the 90%
  per-file branch gate.

Alternatives considered:

- _An ESLint rule_: lint sees one file at a time. The faulty nesting crossed a component boundary
  (`developer-screen.tsx` → `environment-settings-control.tsx`), so a JSX-nesting rule would not
  have caught it.
- _A `console.error` in `__DEV__`_: Jest does not fail on console output in this harness, so the
  gate would be advisory.
- _Make the dialog work inside the host_: the window-lifecycle bug is inside `@expo/ui` Compose
  host nesting, which is alpha upstream code, and every other call site already follows the
  outside-the-host pattern.

Not ADR-worthy: the rule is cheap to reverse and stays inside ADR 060's chrome boundary. It is
recorded in `theming.md` with a link to the enforcing test.

### Decision 3: Home section titles use `type="sectionTitle"` with no local typography

`UpcomingSection` and `TodaySection` populated titles become
`<ThemedText type="sectionTitle">`, and the local `sectionTitle` style is deleted. The title then
has the header role and renders the same ramp step in both states (Android 22/28/400, letter
spacing 0; iOS 20/25/600 with `title3` Dynamic Type). On iOS the weight drops from 700 to 600 and
`dynamicTypeRamp` is gained. This is intended: it matches the empty-state title that already ships.

### Decision 4: The Android date field's accessible label is a combined, localized string

The Android `Pressable` receives
`accessibilityLabel = t("personalEvents.form.dateTimeAccessibilityLabel", { label, value })`, with
EN `"{{label}}, {{value}}"` and FR `"{{label}}, {{value}}"`. `value` is the same
`formatShortDateTime` string as the visible text. When no `accessibilityLabel` prop is passed, the
field passes no label, and the child text is the accessible name. This is the existing
`settingsHub.*.accessibilityLabel` `{{primary}}, {{secondary}}` pattern.

Alternative rejected: `accessibilityValue={{ text }}`. React Native Android exposes it through
node-info state or range fields that TalkBack versions announce inconsistently, and it cannot be
verified here because TalkBack would not bind on the emulator. A combined `contentDescription` is
what TalkBack reads on every version.

### Decision 5: The school-list error state takes the `ListStatus` inset through `style`

In `school-picker-screen.tsx`, `ErrorState` receives
`style={styles.status}` = `{ paddingHorizontal: Spacing.four, paddingVertical: Spacing.five }`.
This uses the existing `style` prop and adds no `ErrorState` API. `school-group-picker-screen.tsx`
is unchanged, because its standard lane already supplies the `Spacing.four` gutter. A test pins
that. The kept `textColor: theme.text` is asserted through the mocked `Stack.Screen` options in
both schemes.

## Risks / Trade-offs

- [The context invariant could catch a legitimate future nesting] → None exists: every primitive
  that calls the hook mounts its own native host. If a future primitive is designed to live inside
  the host, it does not call the hook.
- [The throw takes down the developer page in dev if a contributor misplaces a dialog] → That is
  the intent. The message names the fix, and Jest catches it first.
- [Jest cannot reproduce the orphaned Compose window] → The proof is structural: the invariant
  test plus a developer page test that renders the real environment row and dialog through the real
  host. The owner Android re-check is in the inbox.
- [The combined label repeats "Starts" after the visible "Starts" label] → This is accepted. The
  visible label is a separate, non-focusable text node, and the button's own name must stand alone
  in focus navigation.

## Migration Plan

Leaf UI and chrome changes only, with no persisted data, schema or native configuration. It ships
with the next build. Rollback is reverting the commit.
