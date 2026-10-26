## Context

**Nightly lane.** `.github/workflows/ci-mobile-e2e.yml` has a `prepare` job that, on `schedule`,
lists the workflow's scheduled runs (`actions: read`), takes the newest preceding run's
`head_sha`, diffs it against `main` and sets `should_run=false` when no path under
`mobile/**`, `openapi/**`, `server/**`, the E2E lifecycle, `.nvmrc` or the workflow changed. The
`build-server`, `e2e-mobile-android` and `e2e-mobile-ios` jobs carry
`if: needs.prepare.outputs.should_run == 'true'`, so they are skipped and the run concludes
success. ADR 055 chose this ("conditional daily health signal") and explicitly rejected a
last-success boundary to avoid repeated native allocation. The consequence it did not weigh: a
failing lane is re-run only when a relevant path changes, and every quiet day in between is a
green run. From 2026-09-13 to 2026-10-26 the lane was red on every executed run (#488) and the
Actions history showed mostly green. `mobile/e2e/test_ci_mobile_e2e.sh` (bash, mutation-backed,
run by `ci-mobile.yml` `test-mobile` on every mobile push and on any change to the E2E workflow)
pins the current conditional design line by line.

**SwiftUI identifier cascade.** `@expo/ui` 56 applies a component's `testID` as
`.accessibilityIdentifier` in `UIBaseView` (every SwiftUI component), and the
`accessibilityIdentifier(...)` modifier the same way. SwiftUI propagates an identifier set on a
non-element container to each child and overrides the children's own identifiers. #488 hit this
with settings `Section`s (fixed in `native-settings.tsx`, pinned by
`native-settings.test.tsx` "keeps a row's own testID inside a section with a testID", recorded in
`theming.md` → Identifiers). The `Host` is different: `HostViewProps` has no `testID` field, so a
Host `testID` reaches the UIKit hosting view through React Native and does not cascade, while a
Host `modifiers` entry is applied to the SwiftUI root layout and would. An audit of every
`@expo/ui/swift-ui` consumer in `src/components/chrome/` (`native-settings.tsx`,
`native-settings-numeric-editor.tsx`, `native-settings-header.tsx`, `native-error-notice.tsx`,
`native-text-entry-dialog-ios.tsx`) finds one remaining container identifier:
`accessibilityIdentifier(ids.dialog)` on the sheet `Group` in `native-text-entry-dialog-ios.tsx`.
Every other identifier sits on a `Button`, `Toggle`, `LabeledContent`, `Text`, `TextField` or
`ProgressView`, and the text-entry `Host` carries a `testID` only. The suite-wide Jest mock
(`jest/setup-expo-ui.ts`) turns a container's identifier modifier into that container's `testID`,
which models the identifier but not the cascade, so no unit test can see the defect. No Maestro
flow opens the text-entry dialog yet.

**Picker event.** `date-time-picker.tsx` converts the Android `Date` argument (ADR 066) and passes
the native event through. `@expo/ui`'s `buildChangeEvent`/`buildEvent` set
`nativeEvent.timestamp = date.getTime()` and `utcOffset = -date.getTimezoneOffset()` on the
Compose UTC-midnight Date, and the Android dismissal path passes `value` (the seam's
`composeDayOf(value)`) with a `dismissed` event. Both mocks (suite-wide and the per-file one in
`date-time-picker.test.tsx`) emit `timestamp: 0`, so no test can observe the mismatch. The
suite-wide Android date mock confirms `Date.UTC(2030, 0, 2)`, the same day every gallery fixture
opens on, so `date-time-picker.gallery.test.tsx` passes with or without the conversion reaching
the row.

**L11.** `zoneOffsetTrapImportPath` is a core `no-restricted-imports` path entry with
`importNames: ["getTimezoneOffset"]`. Probing the real config shows it already reports named,
aliased, namespace (`import * as tz`), `export { getTimezoneOffset } from` and
`export * (as tz) from` forms. It does not report `import tz from "date-fns-tz"` or
`import("date-fns-tz")`. No test pins any form. Running `new ESLint()` or `Linter` with the flat
config inside Jest fails (dynamic config import needs `--experimental-vm-modules`; plugin
resolution under jest-expo breaks `eslint-plugin-i18next`). The ESLint CLI with `--stdin` over
the real config returns in about a second.

## Goals / Non-Goals

**Goals:**

- A scheduled E2E run concludes success only when both platforms executed and passed.
- No identifier can sit on a SwiftUI container node in `src/` without failing lint, and the Jest
  mock fails a container identifier that lint cannot see.
- The iOS text-entry dialog's identifiers resolve to distinct elements.
- The Android picker event and `Date` agree in every zone; the gallery test proves a pick reaches
  the row.
- Every `date-fns-tz` import form that can reach `getTimezoneOffset` fails lint, proven through
  the real config.

**Non-Goals:**

- No new Maestro flow for the text-entry dialog (ADR 057 caps the pack at three journeys).
- No change to the Maestro journeys, the E2E harness, the iOS driver retry, or the Android build.
- No PR or push trigger for native E2E; it stays a daily/manual health signal.
- No change to Android chrome identifiers: Compose `testTag` does not cascade.
- No alerting or issue creation on a red nightly (repo policy: no public issues).

## Decisions

### Decision 1: scheduled runs always execute; remove the change detection (ADR-worthy)

`prepare` keeps two jobs: validating a manual `ref` and resolving one immutable `target_sha`
(checked out from `inputs.ref` on dispatch, `main` on schedule). The "Find preceding scheduled
attempt" step, the path diff, and the `should_run`, `comparison_base` and `reason` outputs are
removed. `build-server`, `e2e-mobile-android` and `e2e-mobile-ios` lose their job-level `if:`.
The rename of the select step to "Resolve native E2E target" reflects that it only resolves.
The contract test asserts the new shape structurally: no job-level `if:` anywhere, every
step-level `if:` is exactly `if: failure()`, no `continue-on-error`, no `should_run`,
`listWorkflowRuns` or `git diff --name-only`, and `prepare` outputs only `target_sha`. Mutations
prove each assertion bites.

The permissions block stays `contents: read` + `actions: read`. `actions: read` no longer has a
consumer, but artifact transfer within the run is the one place a token scope change could
silently break the Android job, and the honesty fix should not carry that risk; the read-only
assertion in the contract test still holds.

Alternatives:

- **Keep the skip, report it as neutral, and fail when the last real run failed** (the fallback
  the conductor allowed). GitHub Actions cannot set a workflow conclusion to `neutral` or
  `skipped` from a job; it needs a check-run written with `checks: write`, which ADR 055 rejected
  as write scope. "Fail when the last real run failed" needs the previous executed run's
  conclusion, more Actions API logic, and still shows a red run that executed nothing. Both add
  machinery to keep a saving that is worth nothing here: the repository is public, so hosted
  Linux and macOS minutes are free, and one Android plus one iOS run per day is the whole cost.
- **Keep the skip only for the server-image build.** It rebuilds from the gha cache in a minute;
  a split condition is more surface for the same honesty question.
- **Last-success boundary** (ADR 055 rejected it): still skips on green, still leaves the
  decision logic, and the reason it was rejected (repeat allocation without new work) is now the
  intent.

ADR 071 records this and marks ADR 055's "conditional" cadence and previous-attempt boundary
superseded; the rest of 055 (no PR trigger, immutable target, concurrency, evidence retention)
stands.

### Decision 2: identifiers never sit on SwiftUI containers; lint plus a throwing mock (ADR-worthy enough to record in the Book, not an ADR)

A repo-local rule, `local/no-swiftui-container-identifier`, lives beside
`no-js-call-in-worklet` in `mobile/tools/eslint-rules/` and is wired in a new
`timecalendar/swiftui-identifiers` block for `src/**/*.{ts,tsx}`. It is lint inventory entry
**L12**.

- It records the local bindings of `@expo/ui/swift-ui` imports (named, aliased, namespace) and of
  `accessibilityIdentifier` from `@expo/ui/swift-ui/modifiers` (named, aliased, namespace member).
- On a JSX element whose name resolves to a container (`BottomSheet`, `ControlGroup`,
  `DisclosureGroup`, `Form`, `GlassEffectContainer`, `Grid`, `Group`, `HStack`, `LazyHStack`,
  `LazyVStack`, `List`, `Mask`, `Namespace`, `Overlay`, `ScrollView`, `Section`, `TabView`,
  `VStack`, `ZStack`), it reports a `testID` attribute and any `accessibilityIdentifier` call
  found in the `modifiers` expression. The search walks array literals, spreads, conditional and
  logical expressions, and follows an identifier to a same-file `const` initializer (the
  `const modifiers = [...]` pattern in `SwiftSettingsRow`).
- On `Host`, it reports the modifier only; `testID` is allowed.
- The container list is the set of `@expo/ui` 56 SwiftUI views that lay out or group children and
  are not accessibility elements. Controls and labelled rows (`Button`, `Toggle`,
  `LabeledContent`, `Picker`, `DatePicker`, `TextField`, `Text`, `Image`, `Label`,
  `ProgressView`, `Link`, `Menu`, `ContextMenu`) are elements, so their identifier is their own.
  The list lives in the rule file with that sentence as its rationale.

The rule cannot follow an identifier passed through `{...props}` or a modifier array built in
another module. The suite-wide mock covers that: in `jest/setup-expo-ui.ts`, the container mocks
(`Form`, `Section`, `Group`, `VStack`, `HStack`, `BottomSheet`, and any container the mock adds
later through one shared guard) throw
`SwiftUI <Name> received an accessibility identifier; it cascades onto every child (lint-format.md → L12)`
when given a `testID` or an `accessibilityIdentifier` modifier, and `Host` throws for the modifier
only. Mocks follow the native contract they stand in for (ADR 066 Decision 5). The `Group` mock
gets a fixed `testID: "swiftui-group"` like `BottomSheet`, so tests can still find the sheet's
modifiers.

Alternatives: a contract test that greps chrome files for identifiers near container names
(brittle, misses aliases, cannot follow `const` arrays); a rule scoped to `src/components/chrome/`
only (the chrome-boundary lint already confines `@expo/ui` imports there, so `src/**` costs
nothing and survives a boundary exemption); `accessibilityElement(children: .contain)` on the
container to keep its identifier (not exposed by `@expo/ui` 56 modifiers).

### Decision 3: the text-entry dialog's identifier moves to the title text on iOS

`ids.dialog` is the presence anchor tests and future flows use. On Android it stays on the
Compose dialog surface. On iOS it moves to the title `Text` in the sheet header (a leaf, unique
to the dialog, visible whenever the sheet is). Dropping it on iOS would leave the id
Android-only and force a platform fork in a future flow; putting it on the `BottomSheet` or the
`VStack` reintroduces the cascade. `native-text-entry-dialog.test.tsx` asserts on iOS that
`ids.dialog` is the title text, that `ids.cancel`, `ids.submit` and `ids.input` each resolve to
their own control, and that the sheet `Group` carries no identifier modifier.

### Decision 4: the seam rebuilds the event whenever it converts the Date

In `date-time-picker.tsx`, `toLocal` becomes a function that returns `[event, date]`. When the
Date is converted, the seam returns `{ ...event, nativeEvent: { timestamp: local.getTime(),
utcOffset: -local.getTimezoneOffset() } }` (keeping `type` on the deprecated `onChange` event).
When the Date passes through (invalid, epoch, `undefined`), the event passes through unchanged.
The invariant is "the event describes the Date the consumer receives", which is what
`@expo/ui`'s own builders do for iOS and the time picker. Both mocks change to emit
`buildChangeEvent(picked)`-shaped events (`timestamp: picked.getTime()`,
`utcOffset: -picked.getTimezoneOffset()`), so the Android tests start from the UTC-midnight
timestamp Compose sends and prove the seam rewrites it.

### Decision 5: the suite-wide Android date mock confirms 5 January

`COMPOSE_DAY` in `jest/setup-expo-ui.ts` becomes `Date.UTC(2030, 0, 5)`. No gallery or screen
fixture opens on 5 January, so any Android date pick in the suite is observable. The gallery test
asserts the row shows `format(new Date(2030, 0, 5), { dateStyle: "medium" })` after the confirm
and no longer shows 2 January. The only other consumer of the suite-wide picker mock,
`personal-event-form-screen.test.tsx`, drives no Android date pick; `date-time-field.test.tsx`
has its own mock and is untouched.

### Decision 6: L11 covers default and dynamic imports; a contract test lints through the CLI

`zoneOffsetTrapImportPath.importNames` becomes `["default", "getTimezoneOffset"]` (the message
is unchanged), and `restrictedSyntax` gains
`ImportExpression[source.value='date-fns-tz']` with the L11 message ("import date-fns-tz
statically …"). `require("date-fns-tz")` is already an error under
`@typescript-eslint/no-require-imports`.

`mobile/eslint-l11.contract.test.ts` (beside `ci-timezones.contract.test.ts`) spawns
`node node_modules/eslint/bin/eslint.js --stdin --stdin-filename src/features/calendar/data/l11-probe.ts --format json --rule "prettier/prettier: off"`
with `spawnSync` in `mobile/`, one case per form, and asserts the `no-restricted-imports` /
`no-restricted-syntax` messages it returns (L11 message text included). Invalid: named, aliased,
namespace with `tz.getTimezoneOffset(...)`, default, `export { getTimezoneOffset } from`,
`export * as tz from`, dynamic `import()`. Valid: `formatInTimeZone`/`toZonedTime`/
`fromZonedTime` named imports, and `new Date().getTimezoneOffset()`. A RuleTester test over the
config fragment would not prove that `eslint.config.js` wires it to `src/`; the CLI path does, at
about a second per case.

## Risks / Trade-offs

- [The daily lane goes red on infrastructure flake (iOS driver start, Android `packageRelease`)
  more often, because it runs every day] → That is the honest signal. The iOS retry stays, and the
  Android flake is documented as re-run-before-regression. A red day with no new commit is now
  visible instead of hidden.
- [`actions: read` stays without a consumer] → Read-only; removing it is a separate, provable
  change.
- [The lint rule's container list drifts from `@expo/ui` on an SDK bump] → The list is in one
  place with its criterion; the throwing mock catches what reaches a rendered container in tests.
  A new container component not in the list is a known gap until added; `lint-format.md` → L12
  says to re-check the list against `@expo/ui/swift-ui` exports on each SDK bump.
- [Spawning ESLint from Jest adds ~10 s to the suite and runs under every TZ leg] → Acceptable;
  the cases are independent of TZ and within the 30 s per-test budget.
- [The iOS text-entry dialog cascade is inferred from the settings evidence, not observed] →
  The optional simulator `describe` check in tasks.md confirms it when a development build is at
  hand; the fix is correct either way because leaf identifiers are the documented SwiftUI-safe
  placement.
