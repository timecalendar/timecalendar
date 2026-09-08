## Context

T1–T3 have landed the server catalogue, mobile validation/LKG resolver, and mandatory native
journey. The current native workflow builds release-configuration development variants against the
real test server, but its daily/manual pack is intentionally limited to three business journeys and
does not yet enter the export guide. The test database also leaves the export-guide flag disabled,
so simply adding guide selectors to the existing import flow would fail before it produced useful
integration evidence.

TIM-520 needs a broader, exact-head proof than the daily health signal: deterministic catalogue and
school cases, real server and static-asset failure boundaries, a dedicated Maestro matrix, and
production-identity route-guard checks. The execution host cannot run an emulator or simulator and
does not own physical-device installation, signing, store submission, or live environment mutation.
CI and a reproducible `(HUMAN: ...)` device procedure therefore own those distinct evidence paths.

## Goals / Non-Goals

**Goals:**

- Exercise listed exact mapping, unknown-provider-to-Generic, unlisted selection, Connect URL
  safety, blocking/retry, image degradation, Back, and manual-selector handoff through deterministic
  test-only server data.
- Run shared Android/iOS Maestro flows against release-configuration development variants and one
  immutable server build/fixture version.
- Build production-identity release configurations and prove direct manual/QR/iCal links cannot
  use the development completion seed or bypass the guide.
- Emit evidence that binds every automated result to a commit, workflow run, build contract,
  catalogue fixture, device model/runtime, date, and outcome.
- Give the named physical devices one finite, auditable accessibility/lifecycle matrix which never
  turns unchecked cells into claimed evidence.

**Non-Goals:**

- No catalogue deployment/activation, live flag change, production/preproduction mutation, object
  upload, store submission, signed physical-device installation, or credential use.
- No T1 contract/publication redesign, T2 parser/cache/resolver behavior change, or T3 journey/UI
  rework except a defect exposed by this proof and returned as implementation rework.
- No OpenAPI/generated-client, database migration, dependency, native/store config, Firebase,
  infrastructure, Flutter, or web change.
- No replacement of the daily smoke policy and no `run-e2e` pull-request label.

## Decisions

## Decision 1 — Seed an explicit test-only export-guide world

Extend the existing `NODE_ENV=test` seed path with stable schools and an enabled test flag. The
fixture names and identifiers distinguish: one listed exact ADE mapping with a safe Connect URL;
one valid but unknown provider slug which reaches the wire and resolves Generic; required Connect
rows with missing and unsafe URLs; and the existing unlisted-school path. The packaged bilingual
catalogue remains schema-v1, contains all four initial selectable providers in canonical order,
and receives a T4-specific immutable fixture version plus one declared page image whose approved
first-party URL is intentionally unavailable.

The E2E seed is idempotent within the existing destructive test database initialization and is
never loaded by development or production seeding. Focused tests prove both sides of that boundary,
the exact FR/EN fixture shape, raw unknown slug, and enabled test-only flag. The unavailable image
is an intentional read-only static-asset failure fixture: native rendering must continue through
the documented text-only path. No object is uploaded and no allowlist is widened.

Alternative rejected: mutate a deployed catalogue or bucket for E2E. That is a rollout act, needs
credentials, and makes the result depend on mutable external state. Alternative rejected: add a
runtime fixture switch to the mobile parser; that changes T2 production logic merely to serve the
test harness.

## Decision 2 — Select a dedicated suite without growing the daily smoke pack

Keep `mobile/.maestro/*.yaml` at exactly the three ADR-057 journeys. Put the export-guide flows
under a separate non-discovered directory and teach `mobile/e2e/run_e2e.sh` to accept a closed
`--suite smoke|export-guide` selector. The default remains `smoke`; the chosen directory is
enumerated lexically, helpers remain nested, server lifecycle stays single-lived, and every
top-level flow still gets a fresh Maestro process with the ADR-038 retry classifier.

The export-guide suite may contain multiple focused flows because it is bounded release-proof
evidence, not the daily health budget. Shared platform-neutral test IDs and the existing optional
iOS scheme-confirmation helper remain mandatory. Static tests recursively validate selectors,
suite inventory, helper exclusion, non-vacuous failure assertions, and all harness branches before
a native runner is allocated.

Alternative rejected: append every T4 case to `01-fresh-user-import.yaml`. It would hide several
independent setup/reset journeys inside the daily budget and make an already long health signal
slower and harder to diagnose. Alternative rejected: a second harness would duplicate server
lifecycle and retry semantics.

## Decision 3 — Extend the existing manual workflow with an exact-head proof mode

Add a required manual-dispatch suite input to the existing native workflow, while scheduled runs
continue to select `smoke`. Preparation resolves the requested ref once to an immutable SHA and
publishes the suite and fixture identity. For `export-guide`, both platform jobs build and install
the same release-configuration development variant contract already used by E2E, then call the
shared harness with `--suite export-guide` against the real NestJS/Postgres/Redis server. The server
build uses only test configuration; the test flag is enabled by fixtures rather than by a live
environment write.

Each platform also builds a production-identity Release configuration with a non-production OTA
channel solely for local emulator/simulator execution. A small shared Maestro guard flow opens the
manual, QR, and iCal deep links from cold state and observes recovery to School; a test-only probe
asserts the development completion seed returns false. It never attempts catalogue loading,
calendar creation, or a live environment call. The workflow changes no `app.config.ts`, `eas.json`,
Firebase, signing, or store configuration.

The workflow emits a JSON and Markdown evidence summary even on failure and uploads it with Maestro
and server diagnostics. The summary records the target SHA, suite, app identity/variant, build
configuration, fixture/catalogue version, runner image, selected emulator/simulator model,
OS/runtime and toolchain versions, UTC date, job/run references, and pass/fail. Static workflow
tests require both platforms, exact-SHA checkout, release builds, production guard jobs, artifact
retention, and absence of pull-request/push/label triggers.

Alternative rejected: make native proof a pull-request gate. It conflicts with ADR 055, creates a
slow exact-head merge loop, and the brief explicitly says the label is not normally added.
Alternative rejected: use a development binary to claim production guard behavior; that binary
contains the permitted seed and cannot prove its absence.

## Decision 4 — Treat evidence as an append-only result, not a mutable checklist claim

Add one repository evidence template/runbook that defines stable axis IDs and the required
provenance fields. Automated CI produces a run artifact for its exact SHA; the issue handoff links
that artifact/run rather than copying transient logs into source. Physical-device results use the
same axis IDs and record actual model, OS, build SHA/variant, fixture version, locale/theme/font
configuration, date, tester role, and pass/fail/blocked outcome per observation.

The physical procedure names one supported iPhone with VoiceOver, one supported iPad in portrait
at compact and readable-width boundaries, and one representative supported low-end Android phone
with TalkBack. It covers every briefed accessibility, lifecycle, cache, URL, image, and final-route
axis. Because device installation and screen-reader operation are human-only here, the change adds
a `(HUMAN: ...)` inbox note. Empty cells are `NOT RUN`, not passes; later evidence must name the
same implementation SHA or explicitly start a fresh complete matrix for a newer head.

Alternative rejected: commit a filled pass matrix based on Jest, syntax checks, screenshots, or CI
simulators. Those are different evidence types and would misrepresent the physical-device gate.

## Decision 5 — Update current-state testing guidance and record the exception narrowly

Update `testing.md`, the mobile E2E README, and the Architecture Book changelog to distinguish the
unchanged daily three-journey health signal from the manual export-guide release-proof mode. Add an
ADR only if implementation cannot preserve ADRs 038, 055, and 057 as written. The new proof mode is
feature-specific and manually dispatched, so it does not redefine ordinary feature CI or Phase-10
release readiness.

Alternative rejected: silently expand workflow behavior without documentation. The difference
between informational daily health and required T4 evidence is load-bearing for future changes.

## Risks / Trade-offs

- [The production-identity build accidentally calls a live backend] → Keep its guard flow cold and
  state-empty, assert School recovery before any request-dependent screen, and scan logs/evidence
  for the fixed no-network contract.
- [The test-only flag or schools leak into normal seeds] → Gate their seeding on `NODE_ENV=test`
  and add negative tests for non-test execution.
- [Remote static assets make E2E flaky] → Use the approved-origin image only as the controlled
  broken-image case; successful guide progress depends on text and local server catalogue data,
  never on an external image success.
- [A suite selector bypasses the three-journey invariant] → Keep default discovery pinned to the
  existing directory and mutate-test unknown/missing suite inputs and helper discovery.
- [Workflow summaries claim more than executed] → Generate result fields from job/runtime outputs,
  mark missing jobs/axes failed or not-run, and retain raw artifacts alongside the summary.
- [A later commit invalidates collected evidence] → Require exact SHA equality in the evidence
  checker and rerun the affected complete automated or physical matrix for a changed head.
- [Physical evidence is unavailable during repository delivery] → Keep the procedure finite and
  explicit in the human inbox; do not block or weaken repository merge, and do not mark unrun axes
  complete.

## Migration Plan

1. Add and test the isolated server seed/catalogue cases, then extend the shared harness and static
   selector/inventory checks.
2. Add the manual workflow proof mode, production guard flows, evidence generator/checker, and
   workflow mutation tests.
3. Update the E2E/Architecture Book guidance and add the named physical-device inbox procedure.
4. Run local server/mobile focused gates and strict OpenSpec validation. Push the implementation
   head, manually dispatch the export-guide suite for that exact SHA, and attach the resulting
   Android/iOS run references and evidence artifacts to the issue.
5. A code rollback is a normal revert. No catalogue, flag, bucket, environment, signed build, or
   store state is mutated by this change, so there is no operational rollback.

## Open Questions

None. The approved export-guide specification fixes the required axes; this design preserves the
existing daily E2E policy and makes unavailable physical execution explicit rather than weakening
or fabricating its evidence.
