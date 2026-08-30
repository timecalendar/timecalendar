## Context

The Activity epic is implemented across the NestJS v1 route, committed OpenAPI and Orval client,
React Native SQLite cache/UI, six refresh triggers, and the real-server E2E fixture. The frozen
capacity record in `activity-capacity-gate.md` was measured before the endpoint shipped. It found
that the original query shape passed the sequential-scan wording while still walking the full
global index for the majority empty-calendar cohort, so release acceptance must include G3a and
must exercise the route and code that will ship.

This issue is the evidence gate, not a production rollout. It may use the release-candidate image,
synthetic fixtures, and preproduction systems, but it cannot deploy, submit a store build, use
production credentials, or mutate production. The existing production aggregate snapshot remains
the scale baseline; if a fresh production read is later wanted, the Founding Engineer owns it on a
separate authorized path.

## Goals / Non-Goals

**Goals:**

- bind all evidence to one candidate commit and server image;
- record every frozen gate with the command/method, measured value, baseline, and pass/fail;
- prove the shipped v1 route uses bounded indexed reads and remains healthy under representative
  concurrent requests;
- establish negative evidence that identifiers and payload-derived values do not reach any server
  or mobile telemetry sink;
- prove the compatibility table row by row, including a legacy-request smoke against the candidate;
- write an executable server-first deployment/rollback handoff for the later rollout ticket;
- reconcile current-state documentation and make a failed gate an explicit no-go with a first-class
  fix dependency.

**Non-Goals:**

- a production database read, production load test, image promotion, deployment, OTA, or store
  submission;
- a kill switch (the accepted contract deliberately has none; a future control returns 503);
- API, schema, native/store configuration, infrastructure, or Flutter implementation changes;
- weakening a frozen gate to make the candidate pass.

## Decision 1 — One candidate and one sanitized readiness record

Create `docs/react-native-migration/05-tech-specs/activity-release-readiness.md`. At the start of
the run, record the full candidate commit and immutable server image reference actually exercised
in preproduction. Every evidence row names its command or inspection method, timestamp, measured
value, frozen comparison, and verdict. Raw JSON plans and tool output stay as transient evidence;
the committed record contains only aggregate numbers, redacted plan summaries, check counts, and
links to committed tests.

The record ends in exactly one verdict: `GO`, `NO-GO`, or `PENDING`. `GO` requires every automated,
capacity, privacy, and compatibility gate. `PENDING` is allowed only while executable evidence is
being gathered; it is not a releasable state. Physical-device items live in a `(HUMAN: ...)` inbox
note and do not change the repository-merge verdict.

Alternative rejected: appending results to the frozen gate document mixes baseline and candidate
evidence and makes later comparisons ambiguous. The frozen document remains the measuring stick;
the readiness record is one dated evaluation against it.

## Decision 2 — Measure both the shared SQL and the shipped HTTP route

Re-run the deterministic full-scale capacity harness with the shared
`activity-search.queries.ts` module, then exercise `POST /v1/calendar-logs/search` through the
candidate server with the same 1/10/100-calendar, recent/year/empty/many-change cohorts and page
sizes 50 and 100. Record first/following page p50/p95/p99, unread-count latency, serialized bytes,
status/error rate, and the route's concurrent-read heap and event-loop envelope.

For plans, use only the synthetic non-production database. G3 requires no full sequential table
scan; G3a additionally requires no full global-index walk, checked through access path, rows removed
by filter, and buffers rather than by node name alone. The route and harness must import the same
query module, and the CI plan test remains a tripwire rather than substitute capacity evidence.

Alternative rejected: timing the direct SQL alone cannot catch controller validation, mapping,
serialization, or runtime concurrency regressions. Timing only HTTP cannot explain a planner cliff.

## Decision 3 — Privacy is proved with sentinels at every sink boundary

Use synthetic marker values representing a token, calendar/user/event/log identity, title/location,
and cursor. Run the server controller/service/metrics and sanitizer tests while capturing metric
labels, span attributes, and log arguments; run the Activity coordinator/repository/lifecycle tests
while capturing Crashlytics attributes/errors and analytics calls. Assert the marker values and any
values derived from them are absent, and inspect source-controlled label/attribute allowlists for
only bounded enums such as page and outcome.

Against preproduction, issue only synthetic fixture requests, then inspect the route's metrics,
traces, application logs, Crashlytics test output, and analytics debug output for the same absence.
The committed record names the queries and time window but never copies marker values, payloads, or
raw telemetry.

Alternative rejected: a source-code review alone misses framework-generated HTTP attributes and
runtime logger formatting; dashboard inspection alone is not repeatable and can miss an unexercised
failure branch.

## Decision 4 — Compatibility is an evidence matrix, not a general claim

Copy the authoritative compatibility rows into the readiness record and attach a separate proof to
each. A candidate-server smoke sends the exact valid unversioned array request shape used by the
committed Flutter client and compares its response shape with the legacy contract. Existing v1,
legacy validation, retention/notification coexistence, and mobile environment-reset tests supply
the other rows. Git diff and regeneration checks prove `app/`, the Flutter generated client,
`openapi/openapi.json`, and `mobile/src/api/generated/` did not drift during this review.

The malformed bare-string legacy request remains the one intentional 400 tightening and is not
reported as a regression. “Previous mobile release works” means its real wire shape succeeds
against the candidate server; no Flutter source edit or new generated client is allowed.

Alternative rejected: “legacy tests pass” without exercising the candidate endpoint does not prove
the previous client and the new image interoperate.

## Decision 5 — Mergeable evidence is separate from rollout authority

The readiness record gives the later Founding-Engineer-owned rollout ticket an ordered procedure:
verify and deploy the exact approved server image first; smoke the unversioned and v1 routes; only
then release a store/OTA build that calls v1. Normal rollback restores the previous compatible
mobile release/OTA where runtime compatibility permits and/or the prior server image. The v1 route
and Activity SQLite tables are additive, require no destructive rollback, and the unversioned route
stays available throughout.

This PR performs none of those acts. A `GO` authorizes creation of the separately governed rollout
ticket, not a deployment from this branch.

Alternative rejected: coupling rollout commands to this evidence issue would make a review wake or
repository merge look like deployment authorization.

## Decision 6 — A failed gate creates rework, never an exception

If any frozen, privacy, compatibility, or automated gate fails, stop the release verdict at
`NO-GO`. Use the safe-ticket-dispatch workflow to create a uniquely titled fix child of the Activity
epic, wire this issue's `blockedByIssueIds` to it, and hand the evidence to the Founding Engineer.
Do not lower a threshold, omit a cohort, cap tokens below the accepted contract, or expand into
infrastructure work. After the fix merges, re-run the failed gate and all evidence it can affect.

## Risks / Trade-offs

- **[Preproduction scale differs from the frozen production snapshot]** → Preserve both values,
  state the corpus/traffic scale, and make no claim that preproduction is production load. Use the
  deterministic ratio-preserving corpus for plan selectivity.
- **[A giant single log remains above the page-byte budget]** → Record maximum alongside
  percentiles and exercise `many-changes`; do not claim row pagination is a byte cap.
- **[Telemetry backends retain unrelated old values]** → Use a bounded candidate-specific time
  window and synthetic fixtures, and combine runtime inspection with sink-capture tests.
- **[A previous-release binary is not installable in the agent workspace]** → Prove the exact
  committed client wire request automatically and list the physical install check in the human
  inbox note; do not alter Flutter or block the PR on device access.
- **[Full server/mobile suites are expensive]** → This ticket explicitly requires them; record exact
  commands and split focused capacity/privacy failures from broad-suite failures for diagnosis.
- **[Current docs disagree with implementation]** → Update current-state prose and ticket links. If
  the disagreement changes a load-bearing contract, add or supersede an ADR rather than silently
  rewriting the Architecture Book.

## Migration Plan

1. Resolve and record the candidate commit/image; start the readiness record as `PENDING`.
2. Run the synthetic capacity harness and candidate-route measurements, then fill every frozen gate
   row and retain sanitized aggregate evidence.
3. Run privacy-negative, compatibility, server, mobile, real-server integration, and applicable
   native E2E checks; add the physical-device inbox checklist.
4. Reconcile roadmap, feature map, Architecture Book changelog/ADRs, and final technical-spec ticket
   links. Verify all excluded sensitive surfaces are unchanged.
5. Set `GO` only when every required row passes. On any failure, set `NO-GO`, safely dispatch and
   wire a fix child, and stop the release path.
6. The later rollout ticket deploys the approved server image before any v1-calling mobile build and
   uses additive image/mobile rollback if an observation gate fails.

## Open Questions

None for implementation. Missing preproduction access is an environment blocker owned by the
Founding Engineer; it is not permission to substitute production access or local-only results for
the required preproduction evidence.
