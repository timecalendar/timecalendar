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

### Requirement: The mutator bounds each request with a timeout and forwards cancellation

The single `customFetch` mutator SHALL bound every request with a default timeout so no
generated operation can hang indefinitely on a stalled network, AND SHALL forward a
caller-supplied `AbortSignal` (`options.signal`) into the underlying `fetch` so a hook or
TanStack Query cancellation actually aborts the in-flight request. A timeout or cancellation
SHALL surface as an ordinary network failure (the recoverable `isError` path), not a swallowed
hang, and the mutator's existing success/error contract (base-URL prefix, JSON headers, non-2xx
→ typed `ApiError`) SHALL be unchanged.

#### Scenario: A stalled request is aborted by the default timeout

- **WHEN** the underlying `fetch` never settles and the default timeout elapses
- **THEN** the request is aborted and the resulting rejection propagates to the hook as an
  ordinary network error (surfacing as `isError`), rather than remaining `pending` forever

#### Scenario: A caller's abort signal cancels the request

- **WHEN** a generated operation is called with `options.signal` and that signal aborts (or is
  already aborted) before the response settles
- **THEN** the underlying `fetch` is aborted, so an unmounted/cancelled query does not keep an
  in-flight request alive

#### Scenario: A fast response leaves no dangling timer

- **WHEN** the request resolves before the timeout elapses
- **THEN** the timeout is cleared and the typed response body resolves exactly as before (no
  behavior change to the success path)

### Requirement: Base URL is configurable per environment

Every generated request SHALL resolve its base URL at call time through the typed backend-environment seam. Production SHALL map exactly to `https://api-v2.timecalendar.app`, preprod exactly to `https://preprod-api.timecalendar.app`, and local only to the valid absolute HTTP(S) `EXPO_PUBLIC_API_URL` compiled into a development build. The generated client and mutator contract SHALL expose no custom URL input; capability-aware persistence validation SHALL prevent a production runtime from resolving any other URL.

#### Scenario: Development local selection

- **WHEN** a development build with a valid developer-configured `EXPO_PUBLIC_API_URL` has local effective
- **THEN** every generated operation targets that compiled URL

#### Scenario: Preview preprod default

- **WHEN** a preview build has no valid persisted selection
- **THEN** every generated operation targets `https://preprod-api.timecalendar.app`

#### Scenario: Production is locked

- **WHEN** a production or fail-closed build resolves a request while storage contains any malformed or non-production selection
- **THEN** the operation targets `https://api-v2.timecalendar.app`

#### Scenario: A completed switch changes subsequent requests only

- **WHEN** the reset protocol commits an allowed target and reloads
- **THEN** requests after reload resolve the target environment at call time
- **AND** no request runs during the quiesced reset interval

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

