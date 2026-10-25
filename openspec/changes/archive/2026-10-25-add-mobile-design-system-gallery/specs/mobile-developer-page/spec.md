# Spec Delta

## MODIFIED Requirements

### Requirement: The developer page is gated on a non-production backend capability

The app SHALL expose a developer page at the root route `/developer` and the component gallery
under it (`/developer/gallery` and `/developer/gallery/<story id>`). When the build's backend
environment capability is `production`, opening any route of the `/developer` subtree (from
navigation or a deep link) SHALL redirect to `/settings` and SHALL render none of the developer
tools or gallery fixtures. When the capability is `development` or `preview`, every route of the
subtree SHALL render. All routes of the subtree SHALL use one shared capability check, the same
capability source as the environment control; they SHALL NOT gate on `__DEV__`, the app variant,
or the URL scheme. A route added to the subtree without that check SHALL fail an automated test.

#### Scenario: Production capability redirects away

- **WHEN** a production-capability build opens `/developer`
- **THEN** the app redirects to `/settings`
- **AND** no environment, dev import or gallery row is rendered

#### Scenario: Production capability redirects gallery deep links

- **WHEN** a production-capability build opens `/developer/gallery` or
  `/developer/gallery/native-settings--switches`
- **THEN** the app redirects to `/settings`
- **AND** no fixture renders

#### Scenario: Preview capability shows the page

- **WHEN** a preview-capability build opens `/developer`
- **THEN** the developer page renders with its localized title

#### Scenario: An ungated developer route fails CI

- **WHEN** a route file under the `/developer` subtree mounts a screen that renders in production
- **THEN** the developer-routes contract test fails naming the route

### Requirement: The developer page hosts the developer tools in native grouped sections

The developer page SHALL render through the project-owned native settings composition: one
SwiftUI Form on iOS and one Material list on Android, owning the only content scroll, under the
root Stack's compact native header with a localized title. It SHALL present, in order:

1. a backend section containing the backend environment entry, with unchanged selection,
   confirmation and reset behavior;
2. a test-data section containing an action row that imports a calendar by token, rendered only
   when the app variant is `development` (the variant that the dev import screen accepts);
3. a design section containing a navigation row that opens the component gallery index.

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
- **THEN** the app pushes `/developer/gallery`

### Requirement: Developer page behavior is covered by automated tests

Automated tests SHALL cover the production redirect of every `/developer` subtree route, the
preview and development row sets, the section order, the gallery navigation, the token dialog
submit (trimmed), empty-token and cancel paths on both platform branches, each subtree route's thin
re-export and root-Stack registration with a localized feature-owned title, and the lint rule
(inject-and-revert evidence). The developer screen SHALL meet the 90% per-file branch coverage gate.

#### Scenario: CI proves the gate and the routing

- **WHEN** `npm test -- --coverage` runs in `mobile/`
- **THEN** the developer screen, gallery screens, developer-routes contract and route-structure
  suites pass on the iOS and Android branches
- **AND** the developer screen file clears the 90% branch threshold
