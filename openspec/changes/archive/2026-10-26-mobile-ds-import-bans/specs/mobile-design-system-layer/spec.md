# Spec Delta

## ADDED Requirements

### Requirement: The native chrome seam is reached only through its barrel

Code outside `src/design/` and `src/components/` SHALL import the native chrome seam only through
the `@/components/chrome` barrel and SHALL NOT import a module path below it. The app shell (any
`@/components/` module outside the chrome seam) SHALL be importable only from routes and from
`src/components/` itself. The design-layer gallery entry SHALL stay importable where it is allowed
today (the developer feature, fixtures and the gallery itself). The design import-policy test
SHALL assert these bans per file class, so a lint block that drops them fails CI. No file SHALL be
allowlisted against these bans.

#### Scenario: A feature deep-imports a chrome module

- **WHEN** a file under `src/features/` imports `@/components/chrome/native-list`
- **THEN** `npm run lint` fails with a message that names the `@/components/chrome` barrel

#### Scenario: A feature imports the app shell

- **WHEN** a file under `src/features/` imports `@/components/app-tabs`
- **THEN** `npm run lint` fails with a message that says the app shell is composed by routes

#### Scenario: A route composes the shell

- **WHEN** the tabs layout route imports `@/components/app-tabs`
- **THEN** lint reports no error

#### Scenario: The gallery registry imports chrome fixtures

- **WHEN** `src/design/gallery/registry.ts` imports a fixture under `@/components/chrome/`
- **THEN** lint reports no error

#### Scenario: The developer gallery screen imports the gallery entry

- **WHEN** a file under `src/features/developer/ui/` imports `@/design/gallery`
- **THEN** lint reports no error

#### Scenario: A lint block drops the chrome barrel ban

- **WHEN** a configuration block for a feature directory re-sets import restrictions without the
  chrome-deep or app-shell pattern
- **THEN** the design import-policy test fails naming the file
