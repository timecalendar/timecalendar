## 1. Own test QueryClient lifecycle

- [x] 1.1 Add a narrowly scoped helper under `mobile/src/test-support/` that creates a stable QueryClient/provider pair with query and mutation retry disabled by default, `gcTime: Infinity` for both cache types, optional explicit overrides, and targeted client clearing on teardown; do not alter `mobile/src/api/query-client.ts` or production cache behavior.
- [x] 1.2 Add a focused CI proof test for the helper that exercises query and mutation cache creation, asserts the timer-free defaults, clears/unmounts the client, and confirms both caches are empty; add a repository-shape assertion that rejects new direct test-local `new QueryClient(...)` call sites outside the owned helper/explicit cache-expiry proof.
- [x] 1.3 Migrate the real-hook wrappers in activity triggers, calendar-source add/rename, calendar sync, feedback send, notification subscription, and school-selection query tests to the shared helper; preserve each suite's existing mutator seam, retry behavior, data assertions, and feature boundaries.
- [x] 1.4 Run the new helper/guard test and `src/features/school-selection/data/queries.test.ts` in fresh Jest processes under an external watchdog; confirm Jest itself exits 0 before the watchdog and no cache timer retains either process.

## 2. Contain asynchronous React work

- [x] 2.1 Repair the school-query, add-calendar, and notification-subscription hook error paths so expected rejections and catch/finally state settle within one awaited act scope; await or remove diagnostic refetches so no second request consumes an exhausted one-shot mock or returns `undefined` after assertions.
- [x] 2.2 Repair user-calendars and feedback UI interactions by awaiting RNTL 14 `fireEvent` directly and removing redundant outer act scopes; preserve the rapid-double-submit proof by invoking the press callback twice synchronously inside one explicit awaited act and retaining the one-request assertion.
- [x] 2.3 Repair calendar-screen and personal-events-list preference cleanup so mounted storage subscribers are explicitly unmounted/cleaned before keys are removed in exception-safe `afterEach` teardown; preserve timezone formatting and renderer assertions.
- [x] 2.4 Await every RNTL 14 unmount/rerender involved in `use-color-scheme.test.ts`, and make splash timer/microtask teardown asynchronous, act-owned, and exception-safe while retaining the setup-installed `AccessibilityInfo` spy wrappers and existing reduced-motion assertions.
- [x] 2.5 Re-run every baseline warning suite together and individually; require their existing assertions to pass with no unwrapped-act, overlapping-act, unsupported-act-environment, unawaited-async-act, or query-undefined console error.
- [x] 2.6 Run the affected suites with at least three recorded `--randomize --seed` values; confirm results and warning output are independent of declaration order, and fix ownership rather than adding waits, retries, console suppression, or weaker matchers.

## 3. Record the reusable harness contract

- [x] 3.1 Update `docs/mobile/architecture-book/testing.md` with the shared test QueryClient pointer, timer-free query/mutation cache rule, stable provider ownership, and targeted clearing requirement; retain ADR 044's existing timeout posture and add no new ADR.
- [x] 3.2 Review the finished diff against the Definition of Done and confirm translations, accessibility behavior, testIDs, public feature barrels, dependency direction, production QueryClient defaults, and all declared sensitive surfaces remain unchanged.

## 4. Local-green verification

- [x] 4.1 Run focused Jest commands for every changed helper and suite, capturing stderr/stdout and confirming zero act-related diagnostics and natural exit code 0.
- [x] 4.2 Run `cd mobile && npx tsc --noEmit` and `npm run lint`; fix errors without blanket resets, global console hooks, or unrelated refactors.
- [x] 4.3 Run React Doctor for the changed mobile files using the repository-supported invocation; classify every remaining finding as fixed, pre-existing/non-applicable with evidence, or a scoped follow-up rather than suppressing it.
- [x] 4.4 Run `cd mobile && npm test -- --runInBand` in a fresh process with a bounded external watchdog; accept success only when Jest exits 0 by itself after all suites pass and captured output contains neither the did-not-exit warning nor any act-related console error.
- [x] 4.5 Run `openspec validate stabilize-mobile-jest-lifecycle` and `git diff --check`; confirm no `--forceExit`, sleep-based settling, retry/timeout relaxation, generated-client/OpenAPI drift, migration, native/store/EAS config, deployment/CI workflow, secret, legacy Flutter, debug artifact, or unrelated change is present.

## 5. CI proof on the pushed head

- [x] 5.1 After pushing the implementation, confirm the existing mobile test job runs the standard `npm test` entrypoint on the exact PR head, completes successfully without a job timeout, and contains no Jest did-not-exit or act-related diagnostic; repair the owning seam rather than weakening the gate if it fails.
