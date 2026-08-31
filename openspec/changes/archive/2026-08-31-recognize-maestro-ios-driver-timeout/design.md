## Context

ADR 038 established a per-flow, per-process Maestro lifecycle and a bounded iOS-only recovery mechanism. `mobile/e2e/run_e2e.sh` currently vetoes assertion evidence first, then recognizes only driver-not-listening / connection-refused text when the output also contains `launchApp` or `setPermissions`.

The exact-head iOS run for the Phase 09 `startup_screen` proof used Maestro 2.8.0 with `MAESTRO_DRIVER_STARTUP_TIMEOUT=240000` and `--startup-attempts 4`, but failed before the first application assertion with:

```text
iOS driver not ready in time
LocalXCTestInstaller$IOSDriverTimeoutException
```

That output is an XCTest driver bootstrap timeout, but it does not satisfy the current transport-signature branch, so the harness reported a terminal non-startup failure after attempt 1. The workflow wiring is already present; the gap is the shell classifier and its regression coverage.

Constraints:

- Retry only positively identified XCTest startup failures.
- Assertion, application, and unknown failures remain terminal on their first attempt.
- Preserve Maestro's original non-zero exit status after retry exhaustion.
- Keep the shell compatible with macOS Bash 3.2.
- No simulator/emulator proof is available on this host; CI is the native verifier.

## Goals / Non-Goals

**Goals:**

- Recognize Maestro 2.8.0's observed `iOS driver not ready in time` / `IOSDriverTimeoutException` output as an allowlisted retryable startup failure.
- Exercise the configured attempt bound with the exact observed signature in the fake-Maestro shell harness.
- Retain regression proofs that assertion and unknown failures execute once and stop.
- Keep current-state testing and operator documentation aligned with the executable classifier.

**Non-Goals:**

- Retry arbitrary Maestro, application, assertion, content-timeout, or unknown failures.
- Change Phase 09 application behavior or the unchanged exact head being verified.
- Repair the separate Android fatal-startup failure.
- Increase `MAESTRO_DRIVER_STARTUP_TIMEOUT`, alter the four-attempt CI invocation, or otherwise change workflow behavior unless implementation exposes a concrete wiring defect.
- Change the API contract, database schema, generated client, app native/store configuration, infrastructure, or legacy Flutter app.

## Decisions

### Decision 1 — Add a dedicated positive match for the observed iOS timeout signature

After the existing assertion-first veto, the classifier will accept either of two narrow startup families:

1. the existing `launchApp|setPermissions` plus driver-not-listening / local-connection-refused conjunction; or
2. Maestro 2.8.0's explicit iOS driver bootstrap timeout markers: `iOS driver not ready in time` or `IOSDriverTimeoutException` (case-insensitive).

The timeout markers name Maestro's iOS driver bootstrap path directly, so they do not require the generic `launchApp|setPermissions` context gate that caused the observed false terminal result. The assertion veto still runs first and wins even if a log contains both assertion evidence and a startup marker.

Alternatives considered:

- Require `launchApp|setPermissions` for the new timeout branch: rejected because the observed failure is precisely the output shape that escaped that gate.
- Retry any text containing `timeout`: rejected because content waits and application assertions also time out.
- Retry every `IOSDriverTimeoutException`-adjacent failure without the assertion veto: rejected because combined logs must remain terminal if the flow reached a real assertion.

### Decision 2 — Prove process count and terminal vetoes through the existing fake-Maestro harness

`mobile/e2e/test_run_e2e.sh` will add a scenario whose fake Maestro emits the exact two-line observed signature and fails on every invocation. Running it with the configured maximum (`--startup-attempts 4`) will assert four calls for the first flow, no call for later flows, original exit status preservation, one backend-log dump, and one teardown.

The harness will also carry an explicit unknown-failure scenario and assert that it, like the existing assertion scenario, runs once even with four attempts configured. Existing connection-refused and retry-then-pass cases remain intact to prevent regression of the original allowlist.

Alternatives considered:

- Unit-test the shell function by sourcing `run_e2e.sh`: rejected because sourcing executes top-level lifecycle code and would test less of the real attempt/process control flow.
- Add a native-only reproduction flow: rejected because this classifier is deterministically testable without a simulator and a synthetic flow would not reliably force the Maestro driver exception.

### Decision 3 — Keep ADR 038 and workflow wiring unchanged

This change extends the concrete Maestro 2.8.0 signature set within ADR 038's existing policy; it does not change the retry boundary, process lifecycle, attempt maximum, or architecture. Therefore no new ADR is warranted. `docs/mobile/architecture-book/testing.md` and `mobile/e2e/README.md` will name the additional driver-not-ready timeout signature.

`.github/workflows/ci-mobile-e2e.yml` should remain untouched because it already sets the 240-second startup timeout, invokes `--startup-attempts 4`, runs both shell proofs, and uploads failure evidence. If implementation reveals a necessary workflow edit, it becomes a sensitive-surface change and must receive focused verification of triggers/ref selection, exact-head behavior, timeout/attempt wiring, permissions, and unrelated-diff absence.

## Risks / Trade-offs

- **A broad timeout regex could retry an application failure** → Match only the explicit `iOS driver not ready in time` and exception-class tokens, never a generic timeout word, and retain the assertion-first veto.
- **Maestro may change its wording in a future release** → Keep Maestro pinned at 2.8.0 and default unknown text to terminal; add future signatures only from observed evidence.
- **A retry can re-run a stateful flow** → Preserve ADR 038's bounded startup-only rule; do not classify failures after assertion evidence, and leave known flow re-run caveats visible in the README.
- **Shell behavior can differ on macOS** → Use the existing `grep -Eiq` / Bash 3.2-compatible style and verify through both shell proof scripts.
- **Local checks cannot prove XCTest recovery on this host** → Treat the fake-process harness as classifier/control-flow proof and the existing GitHub-hosted iOS job as the native proof.

## Migration Plan

1. Extend the classifier and fake-Maestro fixtures without changing the CLI or workflow contract.
2. Update the E2E README and Architecture Book current-state wording.
3. Run the two shell proof scripts locally and validate the OpenSpec change.
4. Let standard PR CI exercise the shell proof; native iOS verification follows through the existing E2E workflow path.

Rollback is a direct revert of the classifier branch, fixture, and documentation wording. There is no data or schema migration.

## Open Questions

None. The issue evidence fixes the signature, retry boundary, attempt count, and verification path.
