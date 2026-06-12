# mobile-api-client Specification

## Purpose
TBD - created by archiving change add-mobile-api-client. Update Purpose after archive.
## Requirements
### Requirement: Orval generates TanStack Query hooks from the committed spec
`mobile/` SHALL own an Orval configuration that reads `openapi/openapi.json` and generates TanStack Query v5 hooks and TypeScript types into `mobile/src/api/generated/`. Generation SHALL work offline (no running server) via a single npm script, and the generated output SHALL be committed and pass the project's strict typecheck.

#### Scenario: Regenerating the client
- **WHEN** a developer runs the generate npm script in `mobile/`
- **THEN** hooks and types are (re)generated into `src/api/generated/` from the committed spec, formatted, and `npx tsc --noEmit` stays clean

#### Scenario: Fresh clone typechecks without codegen
- **WHEN** the repo is freshly cloned and `mobile/` dependencies are installed
- **THEN** the mobile project typechecks using the committed generated code, without running Orval

### Requirement: All generated operations go through a single fetch mutator
Generated operations SHALL call one custom `fetch`-based mutator owned by `mobile/src/api/`. The mutator SHALL prefix the configured base URL, set JSON headers, and convert non-2xx responses into a typed error carrying the HTTP status and parsed body. The mobile app SHALL NOT depend on axios.

#### Scenario: Successful request
- **WHEN** a generated hook fires against a reachable server
- **THEN** the request goes through the mutator to `<baseURL><operation path>` and resolves with the typed response body

#### Scenario: Server error surfaces as typed error
- **WHEN** the server responds with a non-2xx status
- **THEN** the hook's `error` is the mutator's typed error exposing the status code and the parsed response body

### Requirement: Base URL is configurable per environment
The mutator's base URL SHALL resolve from `EXPO_PUBLIC_API_URL` when set, defaulting to the production API URL (`https://api.timecalendar.host:1443`) otherwise.

#### Scenario: Development override
- **WHEN** the app is built/started with `EXPO_PUBLIC_API_URL` pointing at a local server
- **THEN** all generated operations target that URL

#### Scenario: No override set
- **WHEN** `EXPO_PUBLIC_API_URL` is not set
- **THEN** operations target the production API URL

### Requirement: TanStack Query runtime is mounted at the app root
`mobile/` SHALL install `@tanstack/react-query` v5 and mount a `QueryClientProvider` in the root layout so any screen can use generated hooks. Query defaults SHALL remain stock (no project-specific policy yet).

#### Scenario: Generated hook usable from any screen
- **WHEN** any route component invokes a generated query hook
- **THEN** it executes through the app-root `QueryClient` without additional per-screen setup

### Requirement: CI fails when generated code drifts from the spec
Mobile CI SHALL re-run Orval against the committed spec and fail if the output differs from the committed `mobile/src/api/generated/`, and SHALL fail on TypeScript errors.

#### Scenario: Spec updated without regeneration
- **WHEN** a commit changes `openapi/openapi.json` but not the committed generated code
- **THEN** the mobile CI drift check fails, and its output names the regeneration command

#### Scenario: Generated code in sync
- **WHEN** the committed generated code matches what Orval produces from the committed spec
- **THEN** the drift check and typecheck pass

