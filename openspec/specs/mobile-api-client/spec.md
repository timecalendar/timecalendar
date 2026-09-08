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
Generated operations SHALL call a custom `fetch`-based mutator owned by `mobile/src/api/`. The mutator SHALL prefix the configured base URL, set JSON headers, and share one timeout/caller-cancellation request routine. Every existing operation SHALL continue through `customFetch`, resolving with its typed body on success and converting non-2xx responses into `ApiError` carrying HTTP status and parsed body. The generated export-guide operation alone SHALL use `customFetchResponse`, resolving an `ApiResponse<T>` that preserves numeric status, the `Headers` object, and optional parsed data for all HTTP statuses including bodyless `304`. The mobile app SHALL NOT depend on axios or add a handwritten export-guide fetch path.

#### Scenario: Existing successful request is unchanged
- **WHEN** any generated operation other than export guides receives a successful response
- **THEN** it continues through `customFetch` and resolves directly with the typed response body

#### Scenario: Existing server error is unchanged
- **WHEN** any generated operation other than export guides receives a non-2xx response
- **THEN** it continues to reject with `ApiError` exposing the status code and parsed response body

#### Scenario: Export-guide response preserves transport metadata
- **WHEN** the generated export-guide operation receives `200`, bodyless `304`, or another HTTP status
- **THEN** it resolves through `customFetchResponse` with status, case-insensitive response headers, and parsed data or `undefined`
- **AND** repository code, not the transport, decides whether the result is a valid catalogue/cache response

### Requirement: The mutator bounds each request with a timeout and forwards cancellation
Both `customFetch` and `customFetchResponse` SHALL use the same default request timeout and SHALL forward a caller-supplied `AbortSignal` into the underlying fetch through one composed controller. Timeout or cancellation SHALL reject as an ordinary transport failure, and a settled request SHALL clear its timeout/controller bookkeeping. The existing `customFetch` base-URL, header, success, and `ApiError` behavior SHALL remain unchanged.

#### Scenario: A stalled request is aborted by the default timeout
- **WHEN** the underlying fetch used by either mutator never settles and the default timeout elapses
- **THEN** its composed request signal is aborted and the rejection propagates instead of hanging

#### Scenario: A caller aborts either mutator
- **WHEN** either generated operation contract is called with a signal that is already aborted or aborts in flight
- **THEN** the underlying fetch receives the aborted composed signal

#### Scenario: A settled request leaves no timeout behind
- **WHEN** either mutator resolves or rejects before the timeout
- **THEN** timeout and in-flight controller bookkeeping are cleared

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

### Requirement: Sensitive endpoint diagnostics are payload-free
The shared mutator SHALL recognize the normalized export-guide pathname without retaining its query string in diagnostics. Development diagnostics for `/contact` SHALL keep their current request/response redaction. Development diagnostics for `/v1/export-guides` SHALL contain only method, normalized path, status when known, a bounded duration bucket, and a static transport outcome; they SHALL exclude the full URL/query, request options and headers, response headers, raw/parsed body, exception message, copy, and asset URLs. Diagnostics for other existing paths SHALL remain unchanged.

#### Scenario: Export-guide success and failure diagnostics are sanitized
- **WHEN** export-guide requests exercise success, `304`, HTTP, timeout, caller-cancellation, malformed, and oversized-body behavior with distinctive sensitive values
- **THEN** no diagnostic argument contains a query value, header/body value, guide copy, cache data, exception message, or asset URL

#### Scenario: Existing contact redaction remains intact
- **WHEN** `/contact` sends and receives payload-bearing content
- **THEN** its diagnostics continue to omit both request and response bodies

#### Scenario: Existing non-sensitive diagnostics remain compatible
- **WHEN** another generated operation logs in development
- **THEN** its existing diagnostic shape and `customFetch` behavior remain unchanged

