## 1. Freeze the virtual-item and cursor invariants in focused tests

- [ ] 1.1 Add pure projection tests for an ordinary log and oversized old/new/changed arrays: pin
  the `newItems → changedItems → oldItems` traversal, intact changed pairs, 256,000-byte greedy
  boundary, stable fragment ids, source id on fragment zero, and exact aggregate reconstruction.
- [ ] 1.2 Add cursor-codec tests that retain every version 1 decode case and cover version 2
  round-trip, full microsecond anchors, zero/positive offsets, malformed/negative/fractional/unsafe
  offsets, unsupported versions, constant error text, and absence of token/event content.
- [ ] 1.3 Mutation-check the focused tests by changing one fragment boundary and one resume offset;
  record that the named identity/reconstruction tests fail, then restore the intended assertions.

## 2. Implement deterministic v1 projection and continuation

- [ ] 2.1 Add a v1-only projection helper that maps a source row into one ordinary item or stable
  valid fragments at atomic change-entry boundaries, using `MAX_FRAGMENT_BYTES = 256_000`; keep the
  unversioned mapper path and stored `calendarChange` untouched.
- [ ] 2.2 Extend the cursor model to decode legacy version 1 cursors and issue version 2 next-position
  cursors carrying a validated safe-integer atomic offset; retain the existing full-precision
  timestamp and UUID validation and constant `Invalid cursor` behavior.
- [ ] 2.3 Extend the repository page seam with the inclusive anchored-row shape used only by a
  positive version 2 offset, with every request value parameter-bound; prove equal timestamps,
  sub-millisecond timestamps, soft-deleted calendars, and exclusive version 1 continuation still
  return source rows in `createdAt DESC, id DESC` order.
- [ ] 2.4 Update `CalendarLogService.searchV1` to consume a prefix of the virtual stream, return at
  most `limit` items, and stop before `MAX_SERIALIZED_PAGE_BYTES = 900_000` using the actual
  serialized response envelope. Point `nextCursor` at the exact first unreturned entry and reject a
  beyond-end offset without logging its value.
- [ ] 2.5 Preserve unread counting as one first-page source-row count, empty-token behavior, all
  current valid v1 request behavior, and closed-enum aggregate telemetry. Add an aggregate-only
  counter for the single-atomic-entry escape without ids, cursors, tokens, or content.

## 3. Prove current consumers and legacy behavior remain compatible

- [ ] 3.1 Extend the v1 controller/service suites to traverse multi-page fragments and assert source
  ordering, fragment contiguity, item limits, byte stops, snapshot stability, no duplicate/omitted
  changes, version 1 cursor compatibility, and first-page-only unread semantics.
- [ ] 3.2 Add a focused React Native repository/coordinator regression using current DTOs: seed a
  cached whole item, store a response whose fragment zero keeps that id plus later distinct ids,
  and prove the old row is replaced while all fragments render/store. Make no mobile production or
  SQLite schema change unless this existing consumer proof exposes a design mismatch.
- [ ] 3.3 Run the unversioned controller tests and add a regression around an oversized source log to
  prove valid array requests still return the one complete legacy item with `calendarToken`, while
  a malformed bare string still returns 400. Inspect `app/` as verification-only and leave it
  unchanged under R-5.

## 4. Add the real serialized-response CI proof

- [ ] 4.1 Extend the deterministic PostgreSQL-backed HTTP test to seed the existing 3,656-change
  log, follow the complete real-route cursor chain at limits 50 and 100, and assert every raw
  response is below 1,000,000 bytes while aggregate category counts reconstruct the source exactly.
- [ ] 4.2 Extend the candidate harness's many-change measurement to include every page in that
  chain when computing serialized-response distributions and the maximum; retain the existing
  sample/warm-up policy, local-only guards, shared production query ownership, and aggregate-only
  output schema.
- [ ] 4.3 Mutation-check the HTTP proof by temporarily removing the 900,000-byte stop and shifting
  the continuation offset; confirm the byte and reconstruction assertions respectively fail, then
  restore the implementation. This focused test is the CI proof test for the correction.

## 5. Update binding documentation and frozen-gate truth

- [ ] 5.1 Add the next available Architecture Book ADR for virtual Activity fragments, stable ids,
  version 1 cursor compatibility, and exact next-position continuation. Update the decision index,
  `data.md`, and `CHANGELOG.md` so `ACTIVITY_PAGE_LIMIT = 50` is described as a virtual-item limit
  paired with the server byte target rather than a 50-log payload assumption.
- [ ] 5.2 Update `docs/react-native-migration/05-tech-specs/activity-capacity-gate.md` with the current
  remediation behavior and local aggregate evidence without weakening G7 or rewriting the failing
  candidate as passing. Record that TIM-522 must freeze a new exact head and rerun affected gates
  after merge; prior candidate evidence is not reusable.
- [ ] 5.3 Review `architecture.md`, `storage.md`, `testing.md`, `definition-of-done.md`, and the
  Activity roadmap against the implementation. Update only reusable current-state rules; create no
  human inbox step because this backend/contract correction has no device or credential action.

## 6. Verify supported contract workflows and local green

- [ ] 6.1 Run the supported server OpenAPI generator with isolated local Postgres/Redis, then the
  supported mobile Orval generator. Assert zero diff in `openapi/openapi.json` and
  `mobile/src/api/generated/`; do not hand-edit either generated surface.
- [ ] 6.2 Run focused server Jest for cursor, mapper/projection, repository, service/controller, legacy
  controller, metrics, and `activity-capacity/http.test.ts`; run the focused mobile Activity
  mapper/repository/coordinator tests. Run server build and focused lint for changed TypeScript.
- [ ] 6.3 Run `openspec validate bound-activity-v1-serialized-pages`, `git diff --check`, and the
  repository disclosure preflight. Inspect the final diff to confirm `server/src/migrations/`,
  `app/`, native/store config, Firebase/config credentials, certificates, Terraform, Kubernetes,
  workflows, retention, and notification writer paths are unchanged.
- [ ] 6.4 Push the implementation and confirm the existing server and mobile CI checks, including the
  real serialized-response regression, are green on the exact PR head. Preserve aggregate-only
  evidence in the PR and handoff; do not paste ids, tokens, cursors, bodies, or event content.
