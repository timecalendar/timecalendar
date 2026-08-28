# Design — remove the non-production environment banner

## Context

`EnvironmentRuntimeGate` (`mobile/src/features/environment/ui/environment-runtime-gate.tsx`) does
two unrelated jobs. The first is load-bearing: it reads the reset journal before any route, query,
sync or notification consumer mounts, and holds the app behind a recovery surface when a switch is
incomplete. The second is cosmetic: on its happy path it wraps `children` in two views and stacks
`NonProductionEnvironmentMarker` — a `SafeAreaView edges={["top"]}` strip — above them.

The strip is what this change removes. Because it claims the top inset, every screen below it
renders shifted, which is what breaks header integration testing and screenshots.

ADR 043 recorded "Local and preproduction show a persistent accessible marker" as a consequence of
the environment work. This change reverses that half and leaves the rest of ADR 043 intact.

## Decision — delete the marker outright rather than gate it

Options were: keep it behind a developer toggle, shrink it to a corner badge that does not consume
insets, or delete it.

A toggle keeps two layout modes alive and guarantees screenshots keep being taken in whichever mode
is currently set — the exact problem being reported. A corner badge still overlays the header it is
meant not to disturb and still has to be excluded from every screenshot. Deleting it is the only
option that makes the development build's layout identical to production's.

The indicator does not disappear: Settings' last section already names the effective environment,
and production renders no such section at all. That is the ticket's own acceptance: the Settings
entry "is way enough to know which env we're using".

## Decision — the Settings entry must carry its value in its accessible name

`EnvironmentSettingsControl` renders a `SettingsRow` whose `label` is "Environment" and whose
`secondary` is the effective environment ("Local" / "Preproduction"). `SettingsRow` renders the
pressable variants as a React Native `Pressable`, which is an accessibility element with an explicit
`accessibilityLabel`. On iOS that collapses the row into a single accessibility element whose name
is the label alone — the secondary `ThemedText` is not exposed. On Android the child text node
survives, so the value is readable there and not on iOS.

That divergence was tolerable while the banner existed (it carried `accessibilityLiveRegion` and
named the environment on every screen). Once the Settings entry is the only indicator, an indicator
invisible to VoiceOver is not an indicator. It is also the reason a Maestro assertion on the
secondary text would pass Android and fail iOS — the known selector trap in this repo.

So the control passes an explicit accessible name that includes the value, through a new localized
key, and keeps the same visible secondary text. That key reuses the composition template the settings
hub already uses for the same job — `settingsHub.summary.accessibilityLabel`, `"{{primary}},
{{secondary}}"` — so the label word is not duplicated into the catalogs a second time:

```tsx
const label = t("environment.selector.label")
const value = t(
  switching ? "environment.selector.switching" : `environment.choice.${current}`,
)
// …
<SettingsRow
  label={label}
  accessibilityLabel={t("environment.selector.accessibilityLabel", {
    primary: label,
    secondary: value,
  })}
  secondary={value}
  …
/>
```

`SettingsRow` already accepts `accessibilityLabel` and prefers it over `label`, so nothing shared
changes. The broader question — whether *every* settings row should expose its secondary text to
assistive technology — is real but belongs to `SettingsRow` and to the rows that would change with
it; it is out of scope here.

Rejected alternative: `accessibilityValue={{ text: secondary }}` on the pressable variants. It is
arguably the more correct semantic split (name "Environment", value "Preproduction"), but it changes
a shared component for every row, and whether Maestro matches an iOS `AXValue` with a text selector
is not demonstrated by any flow in this repo — this change cannot run the flows to find out.

## Decision — Maestro reads the environment from the Settings entry, with selector shapes this repo already proves

The current flow waits on the literal banner strings `TEST ENVIRONMENT · Local` and
`TEST ENVIRONMENT · Preproduction`. Both vanish here. `mobile/e2e/run_e2e.sh` stops at the first
terminal flow failure, so a stale selector left in this file would also suppress every flow after it.

The rewritten flow uses only shapes that already appear in green flows in `mobile/.maestro/`:

- `id:` selectors (`settings.yaml`, `about.yaml`, `personal-events.yaml`, …) to find and tap the row.
- bare text assertions that resolve against a row's accessible name on iOS and its text node on
  Android — this is why `assertVisible: "Personal events"` works on both platforms in `settings.yaml`.

Two adjustments to those shapes:

- The environment section is the last section on the Settings screen and may sit below the fold on a
  phone. Maestro does not scroll on its own, and an element below the fold fails exactly like a
  deleted one. The flow uses `scrollUntilVisible` on `id: settings-environment`, which is a no-op
  when the row is already on screen.
- Maestro matches a text selector as a regular expression against the whole string, so the same
  literal cannot match both platforms: iOS sees `Environment, Preproduction` (the composed accessible
  name) and Android sees `Preproduction` (the secondary text node). The flow asserts
  `".*Preproduction"` / `".*Local"`, which full-matches both and does not match neighbouring copy.

The post-switch half of the flow also changes shape. The banner could be asserted immediately after
the reload; the Settings entry cannot, because the reload lands on the initial route. The flow
returns to the Settings tab after the reload — the same navigation `settings.yaml` performs from a
`clearState` launch, which is the state a completed reset leaves behind.

## Decision — the gate returns its children directly

With the marker gone, `styles.root` and `styles.content` wrap nothing: both are `{ flex: 1 }` and
their parent is already the flexed `GestureHandlerRootView` in `mobile/src/app/_layout.tsx`. The
happy path returns `<>{children}</>` — a fragment rather than bare `children`, because the component's
declared return type is an element. The journal branch, its `SafeAreaView`, and every recovery style
are untouched.

## Verification

- Jest: the marker test is deleted; the gate's mount/recovery/retry tests stay and continue to prove
  the journal path. `environment-settings-control.test.tsx` gains an assertion that the row's
  accessible name carries the effective environment, so the Settings indicator is covered by CI
  rather than by prose.
- `tsc`, ESLint (including the FR/EN i18n parity rule) and the mobile coverage gate all run locally.
- Maestro: not runnable here. The host has no KVM, and the suite is red on `main` at the `calendar`
  flow, which stops the runner before `environment-switch.yaml` is reached — so even a
  device-capable run would not currently prove this file. `run-e2e` is not added by default; the
  device checks move to the existing inbox note.

## Risks

- The rewritten flow is statically reviewed, not executed. The mitigation is to use only selector
  shapes already proven by green flows in this repo, plus `scrollUntilVisible` for the fold. If it
  does fail on a later device-capable run, it fails after `calendar` — which is already failing — so
  it cannot mask signal that exists today.
- Removing a visible marker is the kind of change a tester notices. The Settings entry, the
  production build's absence of that entry, and the enum-only Crashlytics/Analytics context remain
  as the ways to tell environments apart; the spec delta states that explicitly.
