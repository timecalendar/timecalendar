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
  `/developer/gallery/native-list--switches`
- **THEN** the app redirects to `/settings`
- **AND** no fixture renders

#### Scenario: Preview capability shows the page

- **WHEN** a preview-capability build opens `/developer`
- **THEN** the developer page renders with its localized title

#### Scenario: An ungated developer route fails CI

- **WHEN** a route file under the `/developer` subtree mounts a screen that renders in production
- **THEN** the developer-routes contract test fails naming the route
