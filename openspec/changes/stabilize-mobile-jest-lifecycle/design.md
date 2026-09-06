## Context

The baseline `cd mobile && npm test -- --runInBand` run passes 151 suites and 1,311 tests in 85.64 seconds, prints Jest's did-not-exit warning, and remains alive until interrupted. The same command with `--detectOpenHandles` passes in 141.42 seconds but also remains alive without identifying a handle.

An inspector attached after the passing summary reports no active request, network socket, child process, or database descriptor. It reports 46 referenced `Timeout` resources. A trivial non-Query suite exits normally, while `src/features/school-selection/data/queries.test.ts` alone prints the did-not-exit warning and remains alive past an external 35-second bound. That suite creates a TanStack `QueryClient` with the browser/default finite query `gcTime`; once RNTL unmounts its observer, TanStack retains cached queries on referenced garbage-collection timers. Six other suites construct test-local clients with the same incomplete defaults.

The normal run also reports 23 React async diagnostics across eight suites: unwrapped updates, overlapping act scopes, unsupported act-environment updates, and an unawaited async act. Inspection shows four recurring causes: RNTL 14 helpers invoked without awaiting their asynchronous result, `fireEvent` redundantly nested in another `act`, storage cleanup notifying still-mounted subscribers, and rejection/refetch work escaping the act scope that initiated it. Two additional school-query errors come from calling `refetch()` without awaiting it after the one-shot rejection has already been consumed, causing the second request to resolve `undefined`.

The Architecture Book already requires awaited RNTL 14 helpers, targeted exception-safe teardown, and a fixed per-test capacity budget. This change makes those existing rules true in the affected suites and adds the missing test-query-client lifecycle seam. It does not revise ADR 044 or use its timeout as a settling mechanism.

## Goals / Non-Goals

**Goals:**

- Make the complete mobile Jest gate return exit code 0 naturally after its summary.
- Remove every baseline `act`/overlapping-act diagnostic from the affected suites while preserving their assertions.
- Give every test-owned TanStack Query client deterministic, timer-free cache defaults and targeted cleanup.
- Add focused regression proof for the reusable query-client seam and record its current testing contract.

**Non-Goals:**

- Use `--forceExit`, fake success, global console silencing, sleep-based settling, retries, longer waits, or weaker assertions.
- Change application QueryClient cache policy, request behavior, component behavior, translations, accessibility semantics, testIDs, or public barrels.
- Refactor unrelated passing suites or turn all historical RNTL call sites into one broad mechanical rewrite.
- Change CI workflows, OpenAPI/generated code, migrations, native/store/EAS configuration, deployment infrastructure, or legacy Flutter.

## Decisions

## Decision 1 — Own TanStack lifecycle through a test-only QueryClient seam

Add a helper under `mobile/src/test-support/` that constructs test QueryClients with `gcTime: Infinity` for both queries and mutations, retry disabled by default, and optional per-suite overrides. The helper shall expose a stable provider/client relationship and a targeted clear/unmount path so a component rerender cannot silently replace the client and every suite can discard its own cache.

Migrate the seven current test-local QueryClient wrappers to that seam. Keep the production singleton in `src/api/query-client.ts` unchanged: its 24-hour query lifetime is a deliberate persistence contract, and changing it to suit Jest would be a production regression.

`gcTime: Infinity` is test isolation, not a production cache policy. Jest processes are short-lived and tests discard their clients; scheduling a five-minute or longer cache-retention timer has no testing value. Explicit clearing remains useful for state isolation and future finite per-test overrides even though Infinity removes the retained handle.

Alternative: call `--forceExit`. Rejected because it hides resources that still own work and satisfies neither the ticket nor the harness contract.

Alternative: only call `client.clear()` in each existing suite. Rejected because several wrappers currently allocate the client inside the React wrapper render and do not expose it for exception-safe teardown; it also leaves the same trap for the next query-hook test.

Alternative: change the production client's `gcTime` when `NODE_ENV === "test"`. Rejected because test ownership belongs in test support, and environment-conditional production configuration would couple application behavior to Jest.

## Decision 2 — Follow RNTL 14's asynchronous helpers directly

In the warning suites, await `render`, `renderHook`, `rerender`, `unmount`, and `fireEvent` directly. Do not wrap `fireEvent` in a second exported `act`; RNTL 14 already owns that act scope. Use an explicit outer `act` only for direct callback invocation, timer advancement, or a sequence of non-RNTL operations that causes React updates.

For the rapid-double-submit assertion, invoke the captured press callback twice within one explicitly awaited act scope rather than launching overlapping `fireEvent` scopes. This preserves the actual requirement—two synchronous calls before a pending render—without relying on unsupported overlapping acts.

For error-path hooks, catch the expected rejection inside the awaited act scope, then assert it after React has committed catch/finally state. Await or remove diagnostic-only refetches so no second query begins after the test's assertion boundary.

Alternative: add microtask sleeps or longer `waitFor` timeouts. Rejected because timing does not establish ownership and contradicts ADR 044's timeout posture.

Alternative: suppress `console.error`/`console.warn`. Rejected because the diagnostics identify real cross-test work; removing the evidence would preserve the defect.

## Decision 3 — Unmount subscribers before mutating suite-owned external state

Suites that write a reactive storage preference and render a subscriber shall explicitly await RNTL cleanup/unmount before removing the key. Cleanup belongs in an exception-safe `afterEach` path, so a failed assertion cannot leave the preference or mounted listener for the next case. Splash fake timers and mutable native spies shall likewise be drained/reset through an async, exception-safe teardown that keeps the setup-installed spy wrappers intact.

This is test teardown only. The storage observer and application components are behaving correctly when a mutation triggers an update; production code must not be changed to ignore that notification.

Alternative: remove the key inside the test before unmount. Rejected because that is the current source of the unwrapped update.

Alternative: `jest.restoreAllMocks()`. Rejected because it would remove persistent native spies installed by the harness, contrary to the existing Architecture Book rule.

## Decision 4 — Prove the seam locally and let the existing Jest gate prove process exit

Add a focused test for the test-query-client helper that exercises query and mutation cache creation, confirms retry/cache-lifetime defaults, clears the client, and verifies no cache state remains. Run each repaired warning suite as a focused command and require no act-related console diagnostics.

The existing `npm test` CI entrypoint is the process-level proof: no new workflow or alternate command is needed. Local verification shall run it under an external watchdog only to prevent an unfixed branch from consuming the heartbeat; success is accepted only when Jest itself exits 0 before the watchdog and the captured output contains neither the did-not-exit warning nor act-related console errors.

Alternative: add a Jest test that recursively spawns the entire Jest suite. Rejected because nested full-suite execution is expensive, risks recursion/worker contention, and proves a different process topology than CI.

## Decision 5 — Clarify the current testing contract without a new ADR

Update `docs/mobile/architecture-book/testing.md` with a pointer to the shared test-query-client helper and its timer-free/targeted-cleanup rule. This operationalizes the existing mobile-test-harness requirements; it does not introduce a costly-to-reverse application architecture decision, so no ADR or Architecture Book rule change is warranted.

## Risks / Trade-offs

- **[Infinity hides a cache-expiry behavior a test intended to exercise]** → Allow an explicit finite override for a focused cache-expiry test; such a test must advance fake timers and clear the client before returning.
- **[A shared helper becomes an opaque all-purpose render utility]** → Keep it limited to QueryClient construction/provider ownership; leave feature mocks and assertions in their suites.
- **[Directly awaiting events serializes a test that intentionally checks concurrency]** → Use one explicit act around direct callbacks for the rapid-submit case and retain the call-count assertion.
- **[A warning disappears only because test order changes]** → Run affected suites together and with representative `--randomize --seed` values, then run the complete suite from a fresh process.
- **[Cleanup removes harness-installed spies]** → Use targeted clears/resets and explicit unmount/cleanup; do not use blanket restore/reset APIs.

## Migration Plan

Land the test-support helper, affected suite migrations, focused regression test, and testing documentation together. Run focused tests while iterating, then TypeScript, lint, React Doctor classification, randomized affected-suite runs, and the full Jest gate with an external watchdog. Rollback is a single repository revert and has no runtime or stored-data effect.

## Open Questions

None. The retained resources, reproducing suite, affected warning suites, and existing harness rules provide a bounded implementation path.
