## Why

The personal-event editor has accumulated form orchestration, all field rendering, sticky actions, and destructive confirmation in one 429-line React component, making a behavior-sensitive screen difficult to maintain and triggering React Doctor's giant-component finding. Its date/time and color controls also remain in the global component namespace even though personal events are their only production owner.

## What Changes

- Decompose the personal-event editor into cohesive, feature-owned controller and presentation pieces, keeping each React component materially below 200 lines and targeting roughly 100–180 lines where cohesion permits.
- Move the personal-event-only date/time field and color-swatch picker, with their focused tests, from `mobile/src/components/` into `mobile/src/features/personal-events/ui/`.
- Separate palette preset data from the color-picker component module so React Doctor no longer reports a non-component export from a component file.
- Isolate destructive confirmation lifecycle from ordinary form-field rendering while preserving native dismissal, duplicate-prompt, failure, retry, and navigation behavior.
- Preserve create/edit prefill, validation, display-timezone conversion, sticky keyboard-reachable actions, save/delete error handling, localization, accessibility labels, test IDs, routes, and public feature barrels.
- Add or reorganize focused component coverage so the extracted boundaries retain the current behavior contract, then classify any remaining React Doctor findings with evidence.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-personal-events-ui`: require the editor and its single-consumer controls to be owned as cohesive personal-events UI modules while retaining the existing create, edit, validation, timezone, color, save, and delete contracts.

## Impact

- Primary code: `mobile/src/features/personal-events/ui/`, its public barrel, and the existing form/data sublayer imports used by the editor.
- Moves: `mobile/src/components/color-swatch-picker.tsx`, `date-time-field.tsx`, and their colocated tests move under the personal-events feature; their old global paths are removed after all consumers are repointed.
- Tests: focused editor, color-swatch, date/time, and form-hook suites; existing route and Maestro selectors remain unchanged.
- Documentation: update the Architecture Book feature-ownership description and changelog only to reflect the current module location; no architecture rule or ADR changes are expected.
- No API contract, generated client, database schema/migration, dependency, localization catalog, native/store configuration, E2E workflow, infrastructure, deployment, or legacy Flutter change. Sensitive surfaces touched: none expected.
