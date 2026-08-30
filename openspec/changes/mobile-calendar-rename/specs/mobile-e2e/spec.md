# mobile-e2e — delta

## ADDED Requirements

### Requirement: A rename round trip proves the server converged, not just the local row

The suite SHALL carry a `user-calendar-rename.yaml` flow that renames a calendar through the UI and
then proves the new name came back **from the server on a device that never performed the rename**.

The flow SHALL use its own dedicated seeded calendar (`e2e-rename-calendar`), never
`e2e-smoke-calendar`: a rename is a durable server mutation, and `run_e2e.sh` runs the whole folder
in one device session, so renaming the shared smoke calendar would change state under every other
flow in the run.

A shared `rename-seed.yaml` preamble SHALL mirror `import-seed.yaml` for that token — leading
`launchApp: clearState: true`, `stopApp`, `openLink` the dev-import deep link, the optional iOS
"Open" tap, and an `extendedWaitUntil` on the post-import navigation.

The flow SHALL:

1. run `rename-seed.yaml`, then cold-start into `timecalendar-dev://user-calendars`;
2. assert the seeded **baseline** name is visible;
3. open that row's overflow menu by `id: user-calendar-actions-<seeded id>` (never by text — the
   trigger is a `Pressable` whose composed `accessibilityLabel` collapses the child text on iOS),
   choose Rename, enter the target name, and save by `id: user-calendar-rename-save`;
4. assert the new name is visible on the list (the local write);
5. run `rename-seed.yaml` **again**, whose `clearState` wipes the device and whose re-import resolves
   the token from the server, then cold-start into `timecalendar-dev://user-calendars`;
6. assert the **renamed** name is visible — a row whose name can only have come from the server.

The flow SHALL NOT use `- back` (iOS reports it COMPLETED without popping); re-entry SHALL use the
suite's `stopApp` → `launchApp` → `extendedWaitUntil` idiom. Every `extendedWaitUntil` whose
preceding top-level command is `launchApp` or `openLink` SHALL carry `timeout: 60000`. The dialog's
title string and its Save control SHALL be distinguishable from the menu's "Rename" action, so no two
live elements share one anchored selector.

The flow SHALL be cross-platform (no per-platform selector fork beyond the existing optional iOS
"Open" tap) and SHALL run under the existing `run_e2e.sh` folder run. It is native-gate work: it
SHALL be landed without blocking the pull request on an emulator run, since Maestro runs on `main`.

`mobile/e2e/README.md` SHALL record that step 2's baseline assertion requires a freshly seeded
server — CI re-seeds every run, but a local re-run without re-running the seed will fail there
because the calendar is already renamed.

#### Scenario: The rename flow round-trips through the server

- **WHEN** `user-calendar-rename.yaml` runs against the seeded server
- **THEN** the baseline name is asserted, the rename is performed through the overflow menu and the
  controlled dialog, and after a state-clearing re-import the renamed name is asserted on a freshly
  imported row

#### Scenario: The rename flow leaves the smoke calendar untouched

- **WHEN** the full folder run executes
- **THEN** `user-calendar-rename.yaml` mutates only `e2e-rename-calendar`, and every other flow's
  assertions against `e2e-smoke-calendar` are unaffected
