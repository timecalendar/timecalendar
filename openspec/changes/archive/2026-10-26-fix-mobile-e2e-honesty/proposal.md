## Why

The nightly Maestro lane was red on every run that executed from 2026-09-13 to 2026-10-26 (#488).
It still showed green for most of those six weeks, because a scheduled run with no "relevant"
change since the previous scheduled attempt skipped every platform job and reported success. A
health signal that can go green without running anything is not a health signal.

The same investigation and the #489 review left three smaller honesty gaps in the mobile test
surface:

- SwiftUI applies an accessibility identifier set on a container (Section, Group, VStack…) to every
  child and replaces the children's own identifiers. #488 removed the identifiers from settings
  sections only. The iOS text-entry dialog still puts its dialog identifier on the sheet's `Group`,
  so its cancel, submit and field identifiers likely read as the dialog id, and nothing stops the
  next container identifier from landing.
- The chrome `DateTimePicker` reports a device-local `Date` on Android, but the event it passes
  next to it still carries the Compose UTC-midnight `nativeEvent.timestamp`. A caller that reads
  the timestamp gets a different day than the `Date` in UTC− zones.
- The Android gallery picker test confirms the same day the story opens on, so it passes whether
  or not a picked day reaches the row. Lint L11 has no test pinning the import forms it catches.

## What Changes

- **The scheduled E2E run always executes both platforms.** The scheduled change detection (the
  previous-attempt lookup, the path diff and the `should_run` gate) is removed. Every scheduled
  and manual run builds the server image and runs Android and iOS against one resolved commit, so
  a scheduled run's conclusion is the lane's real state. No job or step in the workflow carries a
  condition other than `if: failure()` on diagnostics upload. `test_ci_mobile_e2e.sh` pins this
  with mutations (a re-added job condition, a step condition, `continue-on-error`, or a
  `should_run` gate fails it). ADR 055's conditional cadence is replaced by a new ADR.
- **SwiftUI containers carry no identifier.** A repo-local lint rule fails when an identifier
  (`testID`, or an `accessibilityIdentifier` modifier) is set on an `@expo/ui/swift-ui` container
  node. The Host may keep a `testID` (it is a UIKit view) but not an identifier modifier. The
  suite-wide SwiftUI Jest mock throws when a container receives one, which covers spread props
  that lint cannot see. The iOS text-entry dialog moves its dialog identifier from the sheet's
  `Group` to the title text. An audit of every chrome SwiftUI container finds no other case.
- **The picker event agrees with the picked Date.** On Android date pickers, the chrome seam
  rebuilds the event for every converted Date, so `nativeEvent.timestamp` equals the reported
  Date's time and `nativeEvent.utcOffset` its device offset. The suite-wide and per-file picker
  mocks emit the Compose timestamp the way the native control does.
- **The gallery test proves a pick reaches the row.** The suite-wide Android date mock confirms
  5 January, a day no fixture opens on, and the gallery test asserts the row changes to it.
- **L11 covers every import form.** L11 also bans the default import and dynamic `import()` of
  `date-fns-tz`. A contract test lints named, aliased, namespace (`tz.getTimezoneOffset`),
  default, re-export and dynamic forms through the real ESLint config, and checks that the
  allowed helpers stay clean.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: the native E2E health signal runs both platforms on every scheduled and manual
  run. The scheduled previous-attempt change detection is removed.
- `mobile-lint-format`: L11 covers every static and dynamic import form of `date-fns-tz`. A new
  rule bans identifiers on SwiftUI container nodes.
- `mobile-theming`: iOS native chrome identifiers sit on leaf elements; the text-entry dialog's
  identifiers stay distinct on iOS.
- `mobile-personal-events-ui`: the chrome date picker's event fields agree with the reported
  device-local Date, and the gallery test proves a picked day reaches the row.

## Impact

- CI: `.github/workflows/ci-mobile-e2e.yml` (prepare job simplified, downstream conditions
  removed), `mobile/e2e/test_ci_mobile_e2e.sh` (contract and mutations). Native runner minutes
  rise to one Android and one iOS run per day; the repository is public, so the hosted minutes are
  free.
- Code: `mobile/src/components/chrome/{date-time-picker.tsx,native-text-entry-dialog-ios.tsx}`,
  `mobile/jest/setup-expo-ui.ts`, `mobile/eslint.config.js`, a new
  `mobile/tools/eslint-rules/no-swiftui-container-identifier.js` with its RuleTester test, a new
  `mobile/eslint-l11.contract.test.ts`, and the affected chrome tests.
- No dependency, native configuration, route, OpenAPI, server or Flutter change.
- Book: `testing.md`, `lint-format.md`, `theming.md` (Identifiers), a new ADR 071 superseding ADR
  055's conditional cadence, the decisions index, and a dated 2026-10-26 `CHANGELOG.md` entry.
  `mobile/e2e/README.md` and `docs/agent-dev-environment.md` describe the daily cadence. The
  iOS text-entry identifier item leaves the 2026-10-26 inbox note.
