## Why

Non-production builds render a full-width `TEST ENVIRONMENT · Local` strip above every screen.
It is a `SafeAreaView edges={["top"]}` mounted at the root gate, so it eats the top inset and
shifts every screen down: the top bar can no longer be integration-tested at its real position,
screenshots of the development build no longer match the shipped layout, and design iteration
on any header happens against a frame the store build never has.

The information the strip carries is already available in Settings, whose final section names
the effective environment. That entry is enough to know which backend a test build is talking
to, and it costs no layout.

## What Changes

- Delete `NonProductionEnvironmentMarker`, its styles, its export, its Jest test, and the
  `environment.marker` key from both locales. `EnvironmentRuntimeGate` keeps the whole reset
  journal / recovery path and now renders its children directly, with no wrapper views.
- Make the Settings environment entry the single indicator, and make it readable by assistive
  technology and by Maestro on both platforms: the row's accessible name now includes the
  effective environment, not just the word "Environment".
- Rewrite `mobile/.maestro/environment-switch.yaml` to read the environment from that Settings
  entry instead of the deleted banner strings, and to scroll the entry into view before using it.
- Reverse the marker half of ADR 043 with a dated supersession note, and align `features.md`, the
  Architecture Book changelog, and the existing environment-switch inbox checklist.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-backend-environments`: the Settings entry replaces the persistent marker as the single
  non-production indicator, and the Maestro proof reads the environment from that entry.

## Impact

- `mobile/src/features/environment/ui/` — the marker component, its barrel export and its test are
  deleted; `EnvironmentSettingsControl` gains a value-bearing accessible name. The capability,
  allowlist, persistence, switch orchestrator, journal and recovery surface are untouched.
- `mobile/src/i18n/locales/{en,fr}.json` — `environment.marker` removed, one accessible-name key
  added in both locales. FR/EN parity is a lint gate, so both files change together.
- `mobile/.maestro/environment-switch.yaml` — selectors only. The flow is device-capable-CI only;
  this host has no KVM and cannot run it, and the mobile E2E suite is currently red on `main` at
  the `calendar` flow, so `environment-switch.yaml` is not reached there either. The rewrite is
  reviewed statically against selector shapes that already pass in this repo's flows; `run-e2e` is
  not added by default.
- `docs/mobile/architecture-book/` — binding-rule territory: ADR 043 consequence, `features.md`,
  `CHANGELOG.md`. `docs/react-native-migration/inbox/2026-08-27-environment-switch-device-pass.md`
  loses its marker checklist items.
- No OpenAPI/generated client, no server schema or migration, no `app.config.ts`/`eas.json`/native
  or Firebase configuration, no workflow, no Terraform/Kubernetes, no legacy Flutter change. No
  secrets and no new human-only step.

## Out of scope

- The reset journal, recovery screen, retry path, capability resolution and switch orchestrator.
- Settings section ordering — the environment section is already last.
- `SettingsRow` itself, and the secondary-text accessibility of every other settings row.
- Repairing the unrelated `calendar` E2E failure that currently stops the suite on `main`.
