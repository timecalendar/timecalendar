# Tasks — Bound API requests with a timeout + forward the caller's AbortSignal (TIM-156 / 4.5)

Apply-ready, ordered. All commands run from `mobile/`. The mutator's success/error/logging
contract MUST be preserved **verbatim** — this change only adds a timeout bound and threads
the caller's signal. Single commit (behavior + its first direct unit test), green on
`npx tsc --noEmit` + `npm run lint` + `npm test`.

## 1. Timeout + signal forwarding in `customFetch`

- [x] `mobile/src/api/mutator.ts`: add a named `const DEFAULT_TIMEOUT_MS = 15000` with a
  comment stating it is the hard upper bound on any single request (a stalled network cannot
  hang a query forever).
- [x] In `customFetch`, before the `fetch` call, create an internal `AbortController` and a
  `setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)`. Compose the caller's
  `options.signal`: if it is already `aborted`, abort the controller immediately; otherwise
  register a one-shot `abort` listener (`{ once: true }`) that aborts the controller. Pass
  `signal: controller.signal` to `fetch` (after the `...options` spread, so it overrides the
  otherwise-ignored `options.signal`).
- [x] Wrap the `fetch` + `parseBody` in `try { … } finally { clearTimeout(timer) }` so a fast
  response never leaves a dangling timer. Keep the `__DEV__` request/response logging, the
  header merge, the `parseBody` fallback, and the non-2xx → `throw new ApiError(status, body)`
  exactly as they are today.

## 2. The mutator's first direct unit test

- [x] New `mobile/src/api/mutator.test.ts` — does NOT `jest.mock("@/api/mutator")`; instead
  spy/replace `global.fetch` (`jest.spyOn(global, "fetch")`), restore in `afterEach`. Cover:
  - **(required)** non-2xx (e.g. 422) → the promise rejects with an `ApiError` whose `status`
    is the HTTP status and whose `body` is the parsed JSON body.
  - 2xx JSON → resolves with the typed body; assert the request went to
    `<API_BASE_URL><url>` with the `Accept`/`Content-Type` headers.
  - non-JSON 2xx body → resolves with the raw text (the `parseBody` fallback); empty body →
    `undefined`.
  - a caller-supplied already-aborted `signal` → the composed controller aborts (assert the
    `signal` handed to `fetch` is aborted, or the call rejects) so cancellation is forwarded.
  - default timeout: with `jest.useFakeTimers()` and a `fetch` mock that never resolves,
    advancing past `DEFAULT_TIMEOUT_MS` aborts the request (the `signal` passed to `fetch`
    becomes aborted). Restore real timers after.

## 3. Architecture Book + changelog (R-1)

- [x] Update `docs/mobile/architecture-book/data.md` — the mutator/`customFetch` seam section:
  note the default request timeout + caller-signal forwarding (pointer-style, R-1).
- [x] Append a dated entry to `docs/mobile/architecture-book/architecture-changelog.md` (date ·
  slug `add-mobile-api-request-timeout` · what: `customFetch` gains a default timeout +
  `AbortSignal` forwarding, + the mutator's first direct unit test · why: TIM-151 4.5, a
  no-timeout fetch can hang a query forever · no rule change, no new ADR).

## 4. Local verification + DoD

- [x] `npx tsc --noEmit` clean in `mobile/`.
- [x] `npm run lint` clean (`--max-warnings 0`) in `mobile/`.
- [x] `npm test` green in `mobile/`; `npm test -- --coverage` still clears the K-3 gate
  (`src/api/mutator.ts` now has a direct test).
- [x] Run the DoD checklist: Tests ✅ (new direct mutator test); Observability ➖ (a timeout is
  a recoverable fetch failure, already the isError path — not recorded); i18n / a11y ➖
  (no UI); Architecture Book ✅ (§3).
