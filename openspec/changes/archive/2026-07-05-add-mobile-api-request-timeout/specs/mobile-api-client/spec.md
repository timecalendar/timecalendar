## ADDED Requirements

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
