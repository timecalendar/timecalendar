## MODIFIED Requirements

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

## ADDED Requirements

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
