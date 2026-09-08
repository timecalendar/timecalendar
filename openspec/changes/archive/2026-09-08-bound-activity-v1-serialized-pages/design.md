## Context

`CalendarLogService.searchV1` currently reads `limit + 1` `calendar_log` rows, maps every selected
row to one complete `CalendarLogV1`, and derives the next cursor from the last returned row. The
row query is bounded and fast, but `calendarChange` is JSON with three unbounded arrays. The
deterministic 3,656-change row therefore serialized to 1,600,989 response bytes whether the caller
asked for 50 or 100 rows.

The public v1 shapes are already consumed by the React Native Activity cache: request fields are
`tokens`, `limit`, optional `cursor`, and optional `unreadSince`; response fields are `items`,
`nextCursor`, `asOf`, and optional `unreadCount`. Each item is persisted by its string `id`, and the
UI renders every item as one Activity section. Cursors are opaque to consumers and persisted across
process restarts. The unversioned route is the legacy Flutter contract and must not change.

G7 remains “serialized v1 page p99 under 1 MB.” It is not a compressed-transfer measurement and
is not satisfied by relabelling the pathological maximum. No schema migration is needed: the
stored row remains the notification and retention unit; only the v1 read projection changes.

## Goals / Non-Goals

**Goals:**

- Keep every page produced for the measured many-change shape below 1,000,000 serialized bytes,
  with explicit headroom rather than equality at the gate.
- Return every old, new, and changed entry exactly once across a snapshot-bound cursor chain.
- Preserve stable newest-first source-log ordering, stable within-log array order, existing v1 DTO
  shapes, first-page unread semantics, and current consumer storage behavior.
- Accept previously issued cursor version 1 values so an upgrade does not kill a persisted chain.
- Keep all evidence aggregate-only and make the byte/continuation tests mutation-effective.

**Non-Goals:**

- Changing retention, notification fan-out, change detection, stored `calendar_log` rows, or SQL
  indexes.
- Changing the legacy unversioned route or Flutter source/behavior.
- Weakening G7, adding compression as a substitute for bounding JSON, or accessing live data.
- Guaranteeing that one individually enormous event projection is smaller than 1 MB. The server
  cannot split a string or a changed-event pair without changing `CalendarChangeGet` semantics;
  the frozen p99 gate and this remediation's pathological case concern many ordinary changes.

## Decisions

### Decision 1 — Paginate a virtual stream of valid `CalendarLogV1` fragments

The v1 mapper will retain one ordinary item for a log whose projected DTO fits the per-fragment
target. When it does not, it will greedily partition the change into fragments at atomic entry
boundaries. An atomic entry is one `newItems` element, one `changedItems` pair, or one `oldItems`
element; a pair is never split. Each fragment remains a complete, valid `CalendarLogV1` whose
`calendarChange` contains all three arrays, with unused arrays empty.

The logical within-log traversal order is `newItems`, then `changedItems`, then `oldItems`, matching
the current Activity presentation order. Original order within each array is retained. All
fragments of a source log are emitted contiguously before the next `(createdAt, id)` source row, so
source-log ordering remains `createdAt DESC, id DESC`.

Why this unit: lowering the row count cannot split the dominant row. Splitting at an atomic change
entry is the smallest unit that preserves the existing response schema and never manufactures a
partial changed pair. A normalized or delta-encoded response would require a breaking DTO and a
coordinated client migration.

### Decision 2 — Fragment identities are stable, distinct, and replace an old cached whole log

Fragment boundaries are deterministic for immutable source rows: greedy packing uses a named
per-fragment serialized-byte target and the fixed traversal order from Decision 1. Fragment zero
keeps the source log's existing id. Later fragments use deterministic opaque strings derived from
the source UUID and zero-based fragment index. Their sortable prefix is the immediately preceding
UUID value and their fixed-width suffix decreases as the fragment index increases. The resulting
descending string order is fragment zero, fragment one, fragment two, and then the next possible
source UUID, so existing SQLite and React Native descending-id tie-breaks preserve both fragment
contiguity and traversal without parsing the opaque value.

Keeping fragment zero's old id is a compatibility control, not convenience. A device that cached
the pre-change whole item upserts fragment zero over that row on its first refreshed page instead
of retaining the old whole log beside the fragments. Distinct later ids prevent the current
row-by-row SQLite upsert from silently replacing one fragment with another. The server tests pin
identity stability across repeated requests and uniqueness within/across source logs.

The React Native app needs no production, schema, or reassembly change: every fragment is renderable,
all changes remain present, and its existing descending-id tie-break preserves the encoded order.
Focused mobile regressions prove that storing a fragmented page replaces a cached whole item,
retains every additional fragment, and reconstructs the cached and rendered traversal sequence.
No fragment metadata is added to the public contract.

Alternative: reuse the source id on every fragment. Rejected because the cache's last upsert would
silently discard all earlier fragments. Alternative: give every fragment a new id. Rejected
because a pre-change cached whole item would remain and duplicate its content.

### Decision 3 — Cursor version 2 names the next source-row/entry position

The cursor remains base64url JSON and keeps the snapshot watermark and full-precision source-row
anchors. Version 2 adds the next atomic-entry offset inside the anchored row. Offset zero means the
next source row starts normally; a positive offset means the query includes that exact anchored row
and projection resumes inside it. The repository continues to bind every field as a parameter.

The server accepts version 1 cursors with their current exclusive-row meaning and issues version 2
cursors after the change. That preserves every stored pre-release chain. Version 2 decoding
validates a non-negative safe integer offset and the service rejects an offset beyond the resolved
row's atomic-entry count with the same constant invalid-cursor response. It never echoes cursor
content.

The next cursor always identifies the first not-yet-returned virtual item, not the last returned
one. If packing stops between fragments, it points into the same source row; if the row is complete,
it points exclusively below that row. This makes the no-duplicate/no-omission argument direct:
each request consumes a prefix and hands the exact suffix start to the next request.

Alternative: encode only a fragment number while retaining the old exclusive row query. Rejected
because the anchored row would be filtered out before its remaining changes could be returned.

### Decision 4 — Enforce both the item limit and an exact serialized-page target

The service uses `MAX_SERIALIZED_PAGE_BYTES = 900_000` and a deterministic
`MAX_FRAGMENT_BYTES = 256_000`, leaving fixed safety headroom for the frozen strict inequality. It
stops before either `payload.limit` virtual items or the page target would be exceeded. The decision
uses `Buffer.byteLength(JSON.stringify(candidate))`
over the actual candidate envelope, including `nextCursor`, `asOf`, and `unreadCount`, so estimates
of object or database size cannot drift from what G7 measures.

At least one atomic entry must make progress. If a single-entry item alone exceeds the target, the
service returns that item alone and records only an aggregate overflow outcome; it neither truncates
content nor loops forever. The deterministic many-change fixture contains ordinary bounded entries,
so every page in that required cohort must remain below the target. This explicit exceptional case
is preferable to silently truncating a title/location or breaking a changed pair, and does not
weaken the p99 gate.

The page-row query may still read only a bounded number of source rows: at most `limit + 1`, plus
the inclusive anchor row when resuming inside a log. A virtual page cannot consume more source rows
than virtual items because every source row produces at least one item.

### Decision 5 — Unread, retention, and notifications remain row-based

`unreadCount` continues to count persisted `calendar_log` rows after `unreadSince` and at/before
`asOf`, only on a cursorless first request. Fragmentation is a response representation detail and
must not inflate the badge. The one-year prune and notification outbox continue to consume the
stored source row; neither imports the v1 projection helper.

### Decision 6 — No public contract regeneration, but prove zero drift

The request DTO, response DTO, and `CalendarLogV1` properties do not change. Cursor internals and
item id values are opaque strings in the existing contract. Therefore `openapi/openapi.json` and
`mobile/src/api/generated/` must remain unchanged. The Applier runs the supported server and mobile
generators and treats any diff as a design mismatch rather than hand-editing generated files.

The Architecture Book data rule will describe `ACTIVITY_PAGE_LIMIT = 50` as a virtual response-item
limit combined with the server byte target, not a “50-log page.” A new ADR records Decisions 1–3
because fragment identity and continuation are expensive to change after device caches contain
them. The capacity-gate document records the correction and defers candidate-bound remeasurement to
the release-review owner after merge.

### Decision 7 — Proof follows the real serialized route and is aggregate-only

Focused pure tests pin atomic traversal, deterministic fragment boundaries/ids, exact reconstruction,
and the one-entry escape. Cursor tests pin v1 compatibility plus v2 validation. Repository/service
tests pin inclusive resume, row ordering, item limit, unread behavior, and next-position semantics.

The PostgreSQL-backed HTTP harness seeds the existing 3,656-change fixture, follows its complete
cursor chain, serializes the real response text, and asserts every page is below 1,000,000 bytes.
It also reconstructs aggregate counts per change category to prove no omission or duplication,
without printing bodies, ids, cursors, tokens, or event content. Mutation checks remove the byte
stop and alter the resume offset; each must make a named focused test fail.

## Risks / Trade-offs

- **One source sync may render as several adjacent Activity sections.** → Every section remains a
  valid current DTO and fragment zero retains the source identity; avoiding this visible grouping
  change would require fragment metadata plus mobile persistence/reassembly and a contract change.
- **A single pathological atomic entry can exceed the target.** → Preserve it rather than truncate,
  count the overflow without identifiers, and keep the frozen p99 plus deterministic many-change
  route assertion as the release gate.
- **Changing the fragment algorithm later can leave stale synthetic ids in caches.** → Freeze its
  order, target, and id derivation in an ADR and mutation-effective identity tests; a future change
  requires an explicit cache reconciliation/version plan.
- **Inclusive resume can duplicate the anchor row.** → Use it only for a validated positive v2
  offset, verify the resolved id/timestamp match, and reconstruct the full change stream in tests.
- **Exact repeated serialization costs CPU.** → Keep source reads and candidate count bounded,
  measure the real-route latency with existing capacity cohorts, and implement the packer so it
  serializes bounded candidates rather than every prefix quadratically.

## Migration Plan

This is an additive server behavior rollout with no database migration or backfill. Deploying is
outside this change. Old v1 cursors remain accepted; old clients receive the same DTO shape and
treat fragments as adjacent Activity items. A rollback restores atomic items; fragment zero's
source id remains readable, while additional cached fragment rows are rebuildable Activity cache
data and age out or clear on backend reset. A later rollout that changes fragment identity requires
an explicit mobile reconciliation plan.

After merge, the owner of TIM-522 freezes a new exact candidate and reruns every affected
candidate-bound gate; measurements from the failing candidate are not reusable.

## Open Questions

None. The 900,000-byte page target and 256,000-byte fragment target are binding implementation
constants pinned by serialized-route tests; changing either later is an ADR-governed behavior
change, not a test-only adjustment.
