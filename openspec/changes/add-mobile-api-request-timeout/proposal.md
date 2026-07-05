# Bound every generated API request with a default timeout and forward the caller's `AbortSignal` through the single `customFetch` mutator — plus the mutator's first direct unit test (non-2xx → `ApiError`)

## Why

TIM-151 (the RN app technical-state review) flagged the `@/api` mutator (`4.5`): every
generated TanStack Query operation flows through `customFetch`, but a `fetch` with **no
timeout** hangs indefinitely on a black-hole network (a captive portal, a stalled TLS
handshake, a mobile radio dropping mid-request). The query would sit `pending` forever with
no `isError`, no retry, no recovery — the calendar-sync pull-to-refresh spinner never
resolves. React Native's `fetch` also **ignores** a caller-supplied `options.signal` today
because the mutator never threads it into the underlying request, so a query that unmounts
(TanStack Query aborts via the query's signal) cannot actually cancel its in-flight request.

The mutator is also the one seam with **no direct unit test** — its non-2xx → `ApiError`
contract (the `mobile-api-client` spec's "Server error surfaces as typed error" scenario) is
only exercised transitively through feature mocks that `jest.mock("@/api/mutator")`, so the
real conversion is unproven at the seam.

## What Changes

### 4.5 — default timeout + `AbortSignal` forwarding in `customFetch`

- **Bound each request with a default timeout.** `customFetch` starts an internal
  `AbortController` and a `setTimeout(DEFAULT_TIMEOUT_MS)` that aborts it; the timer is
  cleared in a `finally` so a fast response never leaves a dangling timer. On timeout the
  underlying `fetch` rejects (`AbortError`) and the error propagates to the hook exactly like
  any other network failure — surfacing as `isError` (the recoverable-fetch-failure posture
  the calendar-sync screen already renders), NOT swallowed.
- **Forward the caller's `options.signal`.** When a generated hook (or TanStack Query's own
  cancellation) supplies `options.signal`, the mutator composes it with the timeout controller
  so **either** source aborts the in-flight request: an already-aborted caller signal aborts
  immediately; otherwise a one-shot `abort` listener chains the caller's abort into the
  internal controller. The composed `controller.signal` is passed to `fetch` (it overrides the
  spread `options.signal`, which RN's `fetch` otherwise ignored).
- **No behavior change to the success/error contract.** Base-URL prefixing, JSON headers, the
  `parseBody` text→JSON fallback, the `__DEV__` request/response logging, and the non-2xx →
  `ApiError(status, body)` throw are all preserved verbatim. The timeout constant is a named
  module constant (`DEFAULT_TIMEOUT_MS`), documented as the bound the design requires.

### 4.5 (test) — the mutator's first direct unit test

- **New `mobile/src/api/mutator.test.ts`** exercising `customFetch` directly against a mocked
  `global.fetch` (the one place `@/api/mutator` is NOT itself mocked): the **required** non-2xx
  → `ApiError` proof (status + parsed body on the thrown error), the 2xx → typed-body happy
  path, the text-body fallback when the response is not JSON, that a caller-supplied
  already-aborted `signal` prevents/aborts the request, and that the default timeout aborts a
  never-resolving `fetch` (jest fake timers). This makes the seam's contract provable at the
  seam, not only through feature mocks.

### No new dependency, no native surface

`AbortController` / `AbortSignal` are RN + Node globals already; no polyfill, no package, no
`app.config.ts` / babel / metro / EAS-fingerprint change. No generated-client regeneration
(the mutator signature `customFetch<T>(url, options)` is unchanged — Orval still calls it the
same way).

## Capabilities

### Modified Capabilities

- `mobile-api-client`: the spec gains an ADDED requirement documenting that the single mutator
  **bounds every request with a default timeout and forwards/joins the caller's cancellation
  signal**, with the invariant that a timeout or cancellation surfaces as an ordinary network
  failure (recoverable `isError`), not a swallowed hang. The existing "single fetch mutator"
  requirement's success/error contract is unchanged.

## Impact

- **Modified:** `mobile/src/api/mutator.ts` (timeout controller + signal forwarding; the
  success/error/logging contract preserved verbatim).
- **New:** `mobile/src/api/mutator.test.ts` (the seam's first direct unit test).
- **Docs:** `docs/mobile/architecture-book/data.md` (the mutator seam's timeout/cancellation
  note) + `architecture-changelog.md` (dated entry).
- **Native surface:** none. No new dependency, no `app.config.ts`/babel/metro change, no
  EAS-fingerprint bump. No generated-client change.
