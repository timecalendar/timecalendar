## ADDED Requirements

### Requirement: The developer page environment selector dismisses cleanly on Android

On Android, the developer page's environment selector dialog SHALL render outside the developer page's native page host. Cancel or Back SHALL close it and return input to the developer page. Selecting an environment SHALL close it before the destructive confirmation appears. No selector window SHALL remain after a confirmed switch reloads the app. Row placement, the production gate, the current-environment no-op, single-flight switching and the destructive confirmation SHALL not change.

#### Scenario: Cancel closes the selector

- **WHEN** a development build on Android opens the environment selector and taps Cancel
- **THEN** the selector closes, no confirmation appears, and the developer page rows respond to input again

#### Scenario: Selecting closes the selector before confirming

- **WHEN** the user selects an environment other than the current one
- **THEN** the selector is no longer rendered and the destructive confirmation is presented

#### Scenario: The selector renders outside the developer page host

- **WHEN** the developer page renders for a non-production capability on Android with the selector open
- **THEN** the selector renders as a sibling of the native page host, the environment row stays inside the backend section, and no placement error occurs

## MODIFIED Requirements

### Requirement: The environment control is only mounted by the developer page

The backend environment selector (`useEnvironmentSelector`, `EnvironmentSettingsRow` and
`EnvironmentSelectorDialog`) SHALL be importable only from the developer feature. This SHALL be
enforced by lint: importing any of them by name from the environment feature barrel, or
deep-importing them from the environment feature's `ui` sublayer, SHALL fail `npm run lint`
anywhere outside the developer feature and the environment feature itself.

#### Scenario: Settings cannot re-mount the environment control

- **WHEN** a module under `src/features/settings/` imports `EnvironmentSettingsRow`,
  `EnvironmentSelectorDialog` or `useEnvironmentSelector` from `@/features/environment`
- **THEN** `npm run lint` reports a `no-restricted-imports` error naming the developer page

#### Scenario: The developer feature may mount it

- **WHEN** `src/features/developer/ui/developer-screen.tsx` imports the selector hook, row and
  dialog from `@/features/environment`
- **THEN** lint passes
