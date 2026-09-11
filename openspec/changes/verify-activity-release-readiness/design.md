## Context

Activity's product path is already present: the server owns a bounded v1 search controller backed
by `CalendarLogRepository`, the repository imports the same lateral SQL that the capacity harness
measures, the mobile feature owns one SQLite-backed refresh coordinator, and the shared Maestro
flow exercises unread state, navigation and pagination. The remaining work is a release decision,
not another Activity implementation slice.

The frozen gate predates the complete route and deliberately leaves G8 and G9 to release review.
Its command currently measures SQL and serialization directly, which is necessary for repeatable
planner evidence but insufficient to prove the controller, service, repository, mapper and
response serialization together. The development host cannot supply native emulator/simulator
proof, and this issue authorizes no deployment, production access, live data, credentials, store
submission or infrastructure mutation.

The output must therefore distinguish three kinds of evidence: deterministic local measurement,
exact-candidate automated CI, and environment evidence that may already exist for an immutable
candidate. Missing required evidence is a `NO-GO`, never permission to substitute older results.

## Goals / Non-Goals

**Goals:**

- bind one release-readiness record to one immutable Activity candidate;
- evaluate G1–G9 and G3a without changing the frozen budgets or relabelling missing evidence;
- prove the shipped HTTP route uses the shared lateral query source and stays within its latency,
  planner, payload, concurrency and single-flight bounds;
- verify privacy mechanically across every server and mobile telemetry sink;
- confirm compatibility and executable server-first rollout/non-destructive rollback behavior;
- reconcile the roadmap, Activity specification, Architecture Book and remaining device work.

**Non-Goals:**

- changing the Activity API, DTOs, query semantics, page limits, cache schema, retention,
  notification pipeline or Flutter behavior;
- opening production connections, running production load tests, deploying or promoting images,
  submitting store/OTA builds, or accessing live credentials/data;
- changing Terraform, Kubernetes, native/store configuration or CI merely to obtain evidence;
- fixing a failed gate inside this review or weakening a gate to make the review pass.

## Decision 1 — One fail-closed record owns the release disposition

Create `docs/react-native-migration/05-tech-specs/activity-release-readiness.md` as the canonical
record. It names the full candidate commit, immutable server image identity when already available,
the evidence collection date and environment, and the exact native-CI target. The runtime candidate
is the last code/configuration commit before the evidence-only record; later evidence-only commits
do not silently redefine what was exercised. Every gate row carries the method, command or run
reference, measured value, threshold, evidence location and `PASS`/`FAIL` verdict.

The top-level disposition is `GO` only when every required row passes for that same candidate.
`UNKNOWN`, unavailable, stale, mismatched-candidate and failed evidence all produce `NO-GO`. The
record may describe a pending external action but cannot treat that action as completed.

Historical measurements may guide the method and provide comparison columns, but never satisfy a
candidate-bound row. This prevents a green unit test or an earlier native run from being promoted
into release evidence for a different head.

Alternatives rejected:

- Splitting evidence across issue or pull-request comments makes the decision non-reproducible and
  easy to detach from the candidate.
- Declaring a partial `GO` with follow-up evidence would make a missing release gate informational.
- Making the readiness document's own commit the runtime candidate creates a self-reference loop;
  the record instead names the immutable code/configuration candidate it evaluates.

## Decision 2 — Measure both the reusable SQL and the real HTTP route

Keep the full-scale `compare` harness for deterministic cohort, query-plan, page-byte and
concurrency measurement. Add a narrow route-level measurement module under
`server/src/scripts/activity-capacity/` that boots the real Nest calendar-log module against the
same seeded local PostgreSQL corpus and issues `POST /v1/calendar-logs/search` through the server's
normal HTTP adapter. It measures first/following pages, limits 50 and 100, unread count and
representative concurrent requests without logging response bodies.

The route proof must demonstrate that `CalendarLogRepository.searchPage` imports
`calendarLogPageLateralSql`; there is no copied query in the measurement module. A focused CI test
uses a bounded corpus as a regression proof, while the readiness run records the full-scale
measurement separately. Planner output remains fixture-only and passes through the existing
redactor. The local-host allowlist and explicit database URL remain mandatory.

Alternatives rejected:

- Timing only the SQL misses DTO validation, snapshot creation, unread-count orchestration,
  mapping and serialization.
- Timing only HTTP obscures the planner access path and makes regressions hard to diagnose.
- Capturing a plan against a live environment risks embedding identifiers in otherwise harmless
  output.

## Decision 3 — Privacy is a sink inventory plus synthetic negative proof

Inventory every explicit Activity telemetry edge: server metric names/labels, automatic span
attributes added by Activity code, application log calls, mobile `recordUnknownError` contexts,
Crashlytics attributes and analytics events. A static test asserts bounded literal metric labels
and static mobile contexts. A synthetic marker exercise drives success, validation, cursor,
storage/mapping and network-failure paths, then searches captured metric attributes, spans, logs,
Crashlytics calls and analytics calls for the marker set.

Committed evidence contains only marker-category counts and zero/non-zero results, never marker
values, request bodies, cursors, identifiers or event content. If an already-deployed immutable
candidate and its telemetry window are available without a deploy or new credential access, the
same bounded negative queries may be recorded. Otherwise that required environment row is missing
and the disposition remains `NO-GO`.

Alternatives rejected:

- Source review alone cannot prove automatic or shared instrumentation behavior.
- A redactor applied after capture is weaker than proving the values never reached the sinks.
- Copying raw telemetry excerpts into the repository expands the privacy surface.

## Decision 4 — Exact-candidate CI supplies native evidence; physical-device work stays explicit

The code/configuration candidate must first be pushed. Baseline server/mobile jobs and the existing
manual native workflow then target that full commit SHA; the workflow's resolved target and both
platform job results are recorded. The normal pull-request path is not modified and no ad hoc
workflow flag is added. G9 passes only when the candidate's Activity flow completes on both Android
and iOS with the pagination/ordering assertions intact.

Physical iPhone, iPad portrait, supported Android, VoiceOver/TalkBack, large text and low-end scroll
checks remain in one `(HUMAN: ...)` migration-inbox note. They are release follow-up evidence and
do not create a repository-merge gate. A missing exact-candidate native CI result, by contrast, is
a machine-verifiable gate failure and keeps the release disposition `NO-GO`.

Alternatives rejected:

- Local native claims are impossible on this host and would be unverifiable.
- Reusing a run for another commit violates candidate binding.
- Editing the CI workflow only to manufacture a run expands a verification ticket into a sensitive
  infrastructure change.

## Decision 5 — Compatibility, rollout and documentation are executable rows

The readiness record carries a row for each compatibility promise: React Native v1 behavior;
valid unversioned arrays; malformed bare-string rejection; unchanged Flutter generated client and
behavior; notification-pipeline independence; one-year retention; backend-environment cache reset;
and the previous mobile release against the candidate server. Each row names a mechanical test,
diff, static inspection or already-available environment exercise. No aggregate “compatible” row
may replace the individual checks.

Rollout instructions name an immutable server image first, verify v1 and the unchanged unversioned
route, then permit a store/OTA build that calls v1. Rollback restores a compatible mobile
release/OTA and the prior server image. The additive v1 route and Activity cache tables remain, so
no destructive rollback is required. These are instructions only; execution needs a separate
rollout authorization.

Reconcile the current Activity specification, Phase 07 roadmap, Architecture Book feature map and
book changelog. The review does not change a binding architecture rule, so no ADR is expected. If
implementation discovers that a binding rule must change, it must add an ADR and changelog entry
in the same change rather than silently editing the book.

## Risks / Trade-offs

- **[Route measurement perturbs latency through test harness overhead]** → Record the method and
  warm-up policy, keep SQL and HTTP measurements side by side, and evaluate the HTTP result against
  the frozen end-to-end budget without subtracting overhead.
- **[Evidence commits follow the code/configuration candidate]** → Identify both explicitly and
  prohibit product/configuration changes after the candidate is frozen; any such change creates a
  new candidate and invalidates its head-dependent evidence.
- **[A preproduction image or telemetry window is unavailable without a deploy]** → Record the
  missing evidence and `NO-GO`; route the deployment/telemetry action through separately authorized
  rollout work rather than performing it here.
- **[A gate fails and invites an in-scope quick fix]** → Keep this review `NO-GO`, record the exact
  failing row, and track the bounded correction separately before rerunning the whole affected
  evidence set.
- **[Evidence accidentally carries sensitive values]** → Use synthetic fixtures, aggregate output,
  the existing redactor and a final disclosure/privacy scan; never commit raw request/response or
  telemetry dumps.

## Migration Plan

1. Add the route-level harness/test and privacy-negative proofs, then run focused checks.
2. Freeze and push one code/configuration candidate; after this point only evidence and
   documentation may change without invalidating the candidate.
3. Run the full local capacity comparison and route measurements, compatibility matrix, generated
   contract checks, focused server/mobile suites and complete repository gates.
4. Dispatch the existing native workflow against the candidate SHA and record both platform
   results. Record already-available immutable-image/telemetry evidence, or mark it missing.
5. Write and reconcile the readiness record, roadmap, Activity spec, Architecture Book feature map
   and changelog plus the non-blocking physical-device note.
6. If every row passes, record `GO` and hand rollout to separately authorized work. If any row does
   not pass, record `NO-GO`, track the bounded fix or missing external action separately, and do not
   execute rollout.

Rollback of this repository change is an ordinary revert of verification tooling and documents;
it changes no API, schema or runtime behavior. The documented product rollback remains mobile/OTA
plus server-image rollback with additive route/tables retained.

## Open Questions

None for implementation. Candidate availability, native CI, telemetry and measurements are
evidence outcomes: an unavailable or failing outcome changes the disposition to `NO-GO`, not the
requirements.
