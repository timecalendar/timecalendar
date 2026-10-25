# mobile-developer-page Specification

## Purpose
A dedicated developer page at `/developer` that hosts the app's developer tools (backend
environment switch, calendar dev import, settings gallery entry) on development and preview
builds, and is unreachable on production builds.

## Requirements

### Requirement: The developer page is gated on a non-production backend capability

The app SHALL expose a developer page at the root route `/developer`. When the build's backend
environment capability is `production`, opening `/developer` (from navigation or a deep link)
SHALL redirect to `/settings` and SHALL render none of the developer tools. When the capability is
`development` or `preview`, the page SHALL render. The page SHALL use the same capability source
as the settings gallery and the environment control; it SHALL NOT gate on `__DEV__`, the app
variant, or the URL scheme.

#### Scenario: Production capability redirects away

- **WHEN** a production-capability build opens `/developer`
- **THEN** the app redirects to `/settings`
- **AND** no environment, dev import or gallery row is rendered

#### Scenario: Preview capability shows the page

- **WHEN** a preview-capability build opens `/developer`
- **THEN** the developer page renders with its localized title

### Requirement: The developer page hosts the developer tools in native grouped sections

The developer page SHALL render through the project-owned native settings composition: one
SwiftUI Form on iOS and one Material list on Android, owning the only content scroll, under the
root Stack's compact native header with a localized title. It SHALL present, in order:

1. a backend section containing the backend environment entry, with unchanged selection,
   confirmation and reset behavior;
2. a test-data section containing an action row that imports a calendar by token, rendered only
   when the app variant is `development` (the variant that the dev import screen accepts);
3. a design section containing a navigation row that opens the settings gallery.

Each section SHALL have a localized title. A row SHALL NOT be rendered when its tool would be
inert on the running build.

#### Scenario: Development build shows all three sections

- **WHEN** a development-variant, development-capability build opens `/developer`
- **THEN** the backend, test-data and design sections render in that order

#### Scenario: Preview build omits the inert dev import

- **WHEN** a preview-capability build whose app variant is not `development` opens `/developer`
- **THEN** the backend and design sections render
- **AND** no dev import row is rendered

#### Scenario: Gallery row opens the gallery

- **WHEN** the user activates the gallery row
- **THEN** the app pushes the settings gallery route

### Requirement: Dev import by token routes to the existing import screen

Activating the dev import row SHALL open the native text-entry dialog (a SwiftUI sheet on iOS, a
Material dialog on Android) with a localized title, field label, placeholder, Cancel and Import
actions. Import SHALL be disabled while the trimmed token is empty. Submitting a non-empty token
SHALL close the dialog and push the existing dev import route with the trimmed token as its
`token` parameter; the import itself, its app-variant gate, its error surface and its redirect
to the calendar SHALL remain owned by the dev import screen. Cancel SHALL close the dialog with no
navigation.

#### Scenario: A token starts the existing import

- **WHEN** the user enters `  abc123 ` and submits
- **THEN** the dialog closes
- **AND** the app pushes the dev import route with token `abc123`

#### Scenario: Empty token cannot be submitted

- **WHEN** the token field is empty or whitespace
- **THEN** the Import action is disabled and submitting performs no navigation

#### Scenario: Cancel leaves the page unchanged

- **WHEN** the user cancels the dialog
- **THEN** the dialog closes and no navigation occurs

### Requirement: The developer page is accessible and localized

Every developer page string (title, section titles, row labels, hints, dialog copy) SHALL be
translated in French and English through the typed flat catalog with no lint or parity exemption.
Rows SHALL follow the native settings row contract: one semantic target per row, navigation rows
with a disclosure and a link/button role, action rows without a disclosure, accessible names that
include the row's current value where one is shown, decorative icons hidden from assistive
technology, and platform minimum touch targets. Text SHALL follow the OS font size up to the
largest accessibility size with rows growing rather than clipping, in light and dark schemes.

#### Scenario: Large text grows rows without clipping

- **WHEN** the device uses the largest accessibility text size
- **THEN** every developer row label and hint wraps and the row grows without clipping or
  overlapping its trailing content

#### Scenario: Screen readers announce each tool once

- **WHEN** VoiceOver or TalkBack traverses the developer page
- **THEN** each section title is announced, each row is one focus stop with its localized label
  and role, and icons are not separate focus stops

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

### Requirement: Developer page behavior is covered by automated tests

Automated tests SHALL cover the production redirect, the preview and development row sets, the
section order, the gallery navigation, the token dialog submit (trimmed), empty-token and cancel
paths on both platform branches, the route's thin re-export and root-Stack registration with a
localized feature-owned title, and the lint rule (inject-and-revert evidence). The developer
screen SHALL meet the 90% per-file branch coverage gate.

#### Scenario: CI proves the gate and the routing

- **WHEN** `npm test -- --coverage` runs in `mobile/`
- **THEN** the developer screen and route-structure suites pass on the iOS and Android branches
- **AND** the developer screen file clears the 90% branch threshold
