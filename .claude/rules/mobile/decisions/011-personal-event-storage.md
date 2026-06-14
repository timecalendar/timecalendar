# 011 — Personal-event storage: dates as TEXT ISO-8601 UTC, color as `#RRGGBB` TEXT, uid from `expo-crypto`

> Origin: the `add-mobile-personal-events-data` change (TIM-132), design D2/D3/D4.
> Phase-2 Feature B, data layer. Records the load-bearing storage-representation
> decisions for the first real feature schema; the schema + verified properties
> live in `mobile/src/db/schema.ts` and the Architecture Book "Storage → First
> feature schema — personal events".

## Status

Accepted.

## Context

Personal events is Phase 2's second feature (ADR
[004](./004-phase-1-feature-order.md)), the first to stress **structured
device-local relational data** — the first real `src/db/schema.ts`, the first real
migration, a repository/query layer over the `@/db` seam. Two hard constraints
shape the column representations, and reversing them later is costly, so they earn
an ADR:

1. **Importer fidelity (load-bearing, one-shot, irreplaceable data).** The Phase-09
   one-shot importer replays the Flutter app's sembast JSONL and writes the
   recovered `personal_events` rows into this schema. Its wire format is
   `PersonalEvent.toMap()` in
   `app/lib/modules/personal_event/models/personal_event.dart`: `uid` (UUID
   string), `title`, `color` (`ColorUtils.colorToHex` → a `#RRGGBB` 6-digit hex
   string, alpha stripped), `startsAt` / `endsAt` / `exportedAt`
   (`DateTime.toUtc().toIso8601String()` → UTC ISO-8601 strings), nullable
   `location` / `description`. `kind` is a constant, not stored. The cost of a
   lossy import is **unrecoverable user data** (no server backup) — fidelity is
   non-negotiable.
2. **Range-query needs (the eventual calendar/list).** `findInRange(from, to)` is a
   `>=`/`<=` comparison on the date columns; the calendar needs an ordered range
   scan.

## Decision

**Dates as TEXT holding canonical UTC ISO-8601 strings** (e.g.
`2026-06-14T09:00:00.000Z`) — *not* `integer({ mode: "timestamp_ms" })` epoch-ms.

- **(a) Importer fidelity.** `toMap()` already emits exactly UTC ISO-8601 strings,
  so the importer writes the string verbatim — no parse, no transformation, no
  precision loss, no timezone ambiguity. An epoch-ms column would force the importer
  to `Date.parse()` each ISO string, risking sub-ms/format edge cases or a silent
  `NaN` → corrupt row in a no-backup recovery.
- **(b) Range query.** **Lexicographic ordering of canonical UTC ISO-8601 strings
  is identical to chronological ordering** (fixed-width, zero-padded, `Z` suffix), so
  a TEXT column sorts and range-filters correctly with a plain index, no conversion.
- **The one caveat:** lexicographic = chronological *only* for canonical UTC
  strings. Guaranteed here because every write goes through the repository's
  `eventToRow` mapper, which normalizes via `toISOString()` (always canonical UTC),
  and the importer's source is already canonical UTC from Flutter.

**Color as the `#RRGGBB` hex string, stored verbatim as TEXT.** The importer writes
the `toMap()` `color` value with zero transformation; the future UI parses
`#RRGGBB` → a render color at the presentation edge. Storing a packed integer ARGB
or a constrained palette enum would force a parse/re-encode (alpha-mismatch risk —
Flutter strips alpha on write) and lose the arbitrary-color freedom the Flutter app
allows.

**uid from `expo-crypto`'s `randomUUID()`, wrapped (caller may supply).** New
locally-created events get a v4 UUID (RFC-4122, platform CSPRNG) via a thin
`newEventId()` wrapper — the single import site, swappable. The importer bypasses
the generator by supplying its own recovered uid to the repository's `upsert` (the
`uid` is the identity/upsert key in both the Flutter store and the wire format).

*Rejected:* `integer({ mode: "timestamp_ms" })` / Drizzle `timestamp` mode (lossy
importer parse — the fidelity risk); local-time string (loses the offset, breaks
cross-timezone correctness); integer-packed RGB or a palette enum (lossy color);
a pure-JS `uuid` dep (duplicates platform crypto, outside the Expo lane); a
caller-only uid with no generator (the future create-form needs one).

## Consequences

- The Phase-09 importer can write recovered rows with **no data loss and minimal
  transformation** — it maps `toMap()` keys to columns once, no value parsing.
- The TEXT date range query is correct and indexable *as long as* every write stays
  canonical UTC — enforced by the mappers (tested) and the importer's source.
- A new native dep, `expo-crypto`, enters `mobile/package.json`. It **autolinks
  with no `app.config.ts` plugin entry** (it ships no config plugin — verified by
  `expo prebuild`; mirroring `react-native-mmkv`). The uid wrapper is mocked under
  Jest, so `tsc`/lint/Jest (CI `test-mobile`) are unaffected; the native link is
  verified by prebuild/e2e (config-shape, not lint — R-1).
- The domain type exposes `Date` (the `rowToEvent`/`eventToRow` mappers convert at
  the edge), so consumers never touch the string format.

## Revisit if

- A query or performance need genuinely requires numeric timestamps (e.g. an
  arithmetic aggregation the TEXT range scan can't serve) — re-weigh epoch-ms
  against the fidelity cost then.
- The Flutter wire format changes before the Phase-09 importer runs (re-align the
  columns to the new `toMap()`).
- A surface needs a non-`#RRGGBB` color representation (re-weigh the verbatim-text
  choice for that surface).
