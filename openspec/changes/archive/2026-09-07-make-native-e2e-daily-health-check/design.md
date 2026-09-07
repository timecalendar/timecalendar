## Context

The native workflow currently runs for labeled pull requests and for every relevant push to `main` or `production`. Each invocation cold-builds the server and two native applications, then boots an Android emulator and iOS simulator. The fast mobile workflow already runs selector, harness, and workflow-structure tests without native devices, so ordinary pull requests can retain strong executable checks without starting the native workflow.

This change makes the expensive workflow an asynchronous integration-health signal. The schedule must avoid a fixed lookback window, manual diagnosis must use a caller-selected revision, and all jobs in an invocation must build and test one resolved commit. The workflow remains a sensitive, non-deploying CI surface. This host cannot supply KVM or an iOS simulator, so local proof is structural and the deliberate workflow dispatch is the native proof path.

## Goals / Non-Goals

**Goals:**

- Run Android and iOS once per daily scheduled attempt when relevant changes landed on `main` since the preceding scheduled attempt.
- Let an operator deliberately run both platforms against a required ref or SHA.
- Keep native E2E absent from ordinary pull-request and push events and from required feature proof.
- Preserve the native build contract, Maestro harness behavior, and failure artifacts.
- Encode trigger, path, ref, cadence, and artifact invariants in focused tests that need no emulator.
- Reconcile all binding current-state policy and roadmap language through an ADR and canonical spec delta.

**Non-Goals:**

- Change the Maestro flow inventory, assertions, retry classifier, server lifecycle, or native build configuration.
- Repair current runner or XCTest failures, add retry loops, or provision dedicated hardware.
- Change the API contract, generated client, schema, migrations, deploy infrastructure, store configuration, credentials, or legacy Flutter application.
- Use a pull-request label or required native check as an indirect merge gate.

## Decision 1 — Compare scheduled workflow-run head SHAs

A lightweight preparation job queries the Actions API for this workflow's scheduled runs and selects the newest scheduled run whose run number precedes the current run. Its `head_sha` is the previous scheduled-attempt boundary. The job checks out full history at current `main`, resolves the current commit, and diffs the boundary SHA against it using an explicit relevant-path list. With no prior scheduled run, it fails open to one full native run so the health signal is initialized.

The boundary is the preceding attempt regardless of conclusion. A skipped, failed, or cancelled attempt still advances the comparison point; failures are maintenance signals rather than a mechanism that repeatedly consumes native runners until another commit lands. The lookup uses `actions: read` and the existing `GITHUB_TOKEN`; repository contents remain read-only.

Relevant scope includes `mobile/**`, `openapi/**`, `server/**`, `ci/e2e-server.sh`, `ci/generate-dummy-firebase-key.sh`, `.nvmrc`, and the native workflow itself. This covers application and Maestro code, generated-contract source, exercised backend behavior and build inputs, shared E2E lifecycle/configuration, and workflow logic. The Applier must verify the exact lifecycle dependency set before finalizing the list.

Alternatives rejected:

- A fixed 24-hour window can miss changes when schedules are delayed or disabled, or re-run old changes when attempts shift.
- A mutable branch, tag, cache, or artifact checkpoint needs write permissions and creates a second state lifecycle with race and retention failure modes.
- Comparing with the last successful native run turns an informational failure into automatic daily retries and does not match the requested previous-attempt boundary.

## Decision 2 — Resolve one immutable commit before fan-out

The preparation job exposes `should_run`, `target_sha`, and comparison metadata. Scheduled events resolve `main`; manual dispatch requires a non-empty `ref` input accepted by GitHub checkout, then resolves it to a commit SHA. The server-build, Android, and iOS jobs all depend on preparation, are conditioned on `should_run`, and check out `target_sha`. Image tags and diagnostics use that same SHA rather than the workflow-definition SHA.

Manual dispatch always sets `should_run=true`, so a diagnosis never depends on path detection. Invalid or unreachable refs fail in preparation before native runners are allocated. The workflow logs the resolved SHA and why a scheduled attempt ran or skipped, without accepting shell-interpolated ref text.

Alternatives rejected:

- Relying only on the branch selector in the dispatch UI does not make the diagnostic target explicit in the workflow contract.
- Letting each job resolve a mutable branch independently permits the branch to move between platform checkouts.
- Attaching manual runs to a pull-request label recreates the repeated exact-head loop this policy removes.

## Decision 3 — Serialize native workflow invocations without cancellation

One workflow-level concurrency group covers daily and manual invocations with `cancel-in-progress: false`. This prevents two expensive native invocations from overlapping while preserving a running diagnostic or daily signal. Later requests queue and then resolve their own target; they do not cancel evidence already being collected.

Alternatives rejected:

- Separate schedule and manual groups allow both costly platform pairs to overlap.
- Cancelling the in-progress invocation discards failure evidence and can repeatedly prevent either platform pair from completing.

## Decision 4 — Keep pull-request protection in the fast baseline

The native workflow declares only `schedule` and `workflow_dispatch`. No `push`, `pull_request`, label condition, or `production` trigger remains. Ordinary pull requests continue through `ci-mobile.yml`, which watches changes to the native workflow and executes `test_run_e2e.sh` plus `test_ci_mobile_e2e.sh`. The workflow-structure test is expanded to assert the allowed triggers, required manual input, previous-attempt lookup, relevant paths, both jobs' shared preparation condition and SHA, concurrency, and retained failure uploads.

The test should parse enough YAML structure to distinguish job/step ownership and conditions; simple global substring counts are retained only for isolated invariants. It must also reject the old `run-e2e`, pull-request, push, and exact-head policy shapes. Native execution is intentionally not a merge requirement, including for an E2E-focused pull request; its author can dispatch the branch or SHA and treat the result as diagnostic evidence.

## Decision 5 — Record the policy as a load-bearing ADR

A new Architecture Book ADR records native E2E as a conditional daily/manual health signal and explains the previous-attempt boundary, both-platform cadence, PR baseline separation, and concurrency. `testing.md`, `definition-of-done.md`, Phase 01, Phase 10, the migration approach where it defines DoD, the agent environment handbook, and the canonical `mobile-e2e` spec are updated to the same current-state rule. Active agent-facing guidance is searched for `run-e2e`, exact-head native proof, per-push native execution, and claims that Maestro automatically runs on every `main` commit.

The feature DoD continues to require a meaningful shared Maestro flow where practical, but completing an ordinary feature means committing the flow plus passing static selector/harness protection; it does not require executing native runners on that feature head. Cross-platform native health is observed on the next relevant daily run or a deliberate manual dispatch.

## Risks / Trade-offs

- [A relevant dependency is omitted from the path list] → Derive the list from the workflow and shared lifecycle, document it in the ADR, and assert every category in the focused test.
- [The previous run SHA is unavailable after history rewriting] → Fetch full history and fail the scheduled preparation visibly rather than silently reporting no changes; the manual path remains available for diagnosis.
- [A workflow-run API change or permission regression breaks detection] → Declare least-privilege `actions: read`, test the lookup structure, and let preparation fail red before native allocation.
- [Daily and manual requests queue behind a long run] → Serialization favors complete evidence over overlap; the queue remains visible in Actions and no run is silently cancelled.
- [An informational scheduled failure is ignored] → Preserve debug/server artifacts and make the Architecture Book explicit that maintenance owns the signal while unrelated feature delivery continues.
- [Static tests give false confidence about native behavior] → Describe them only as workflow/harness contract proof; use the deliberate manual dispatch for implementation-focused native evidence and the schedule for ongoing health.

## Migration Plan

1. Update the workflow controller and focused static test while retaining both native job bodies and artifact steps.
2. Add the ADR and reconcile all active policy/spec references in the same change.
3. Run shell syntax, focused harness/workflow tests, YAML parsing or action lint available in the repository, OpenSpec validation, formatting, and diff/disclosure checks locally.
4. Let ordinary baseline CI prove the proposal and implementation head without invoking native runners. For E2E-focused confidence, manually dispatch the exact implementation SHA; this is evidence, not a merge gate.
5. Roll back with a normal revert if scheduling or ref resolution is defective. No data migration, deployment, or external state cleanup is involved.

## Open Questions

None.
