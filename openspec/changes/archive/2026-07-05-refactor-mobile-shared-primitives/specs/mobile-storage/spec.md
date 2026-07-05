## ADDED Requirements

### Requirement: A single uid generator on the `@/db` seam

The app SHALL generate device-local record identities (row primary keys such as
`personal_events.uid`, `user_calendars.id`, `checklist_items.uuid`) through **one** shared
`newId(): string` helper owned by the `src/db/` seam and re-exported from `@/db`, rather than
per-feature uid wrappers. `newId` SHALL be a thin wrapper over `expo-crypto`'s `randomUUID`
(an RFC-4122 v4 UUID via the platform CSPRNG). No feature SHALL define its own uid wrapper, so
the generator is one swappable seam. This consolidates three previously byte-identical
per-feature wrappers with no change to the generated value's shape or the callers' behavior;
the Phase-09 importer still bypasses `newId` by supplying its own recovered identity.

#### Scenario: The uid generator is a single delegation to the platform CSPRNG

- **WHEN** `newId()` is called
- **THEN** it returns the value from `expo-crypto`'s `randomUUID` (a v4 UUID)
- **AND** it is the only uid wrapper in the app — feature data layers import `newId` from
  `@/db`, and no feature defines its own `randomUUID` wrapper

#### Scenario: A create path uses the shared generator, an importer bypasses it

- **WHEN** a feature creates a new local record that needs a fresh identity
- **THEN** it obtains the identity from `@/db` `newId()`
- **AND** an import path that already carries a recovered identity writes that identity
  directly through the repository without calling `newId`

### Requirement: Total JSON-array parsing on the `@/storage` seam

The `@/storage` seam SHALL provide shared, **total** JSON-array parsing helpers over KV blob
values: a `isStringArray(value: unknown): value is string[]` type guard, and a
`parseJsonArray<T>(raw: string | undefined, guard?: (v: unknown) => v is T): T[]` parser.
`parseJsonArray` SHALL **never throw** and SHALL degrade to the empty array on every
non-conforming input — an `undefined` raw, an unparseable (non-JSON) raw, a parsed value that
is not an array, and (when a `guard` is supplied) an array whose elements do not all pass the
guard — otherwise returning the parsed array typed as `T[]`. When no `guard` is supplied it
SHALL cast the parsed array without per-element validation. Feature stores that parse a
JSON-array KV blob SHALL use these helpers rather than re-implementing the try/catch → empty
posture, so the defensive/total-read contract that protects the app's irreplaceable,
no-server-backup local data lives in one place and is applied uniformly. This consolidates the
previously duplicated `parseGroupValues`, `parseHiddenEvents`'s `isStringArray`, and the
calendar sync `decodeJsonArray` with their exact behavior preserved.

#### Scenario: A malformed or absent value decodes to the empty array, never throwing

- **WHEN** a JSON-array KV blob is parsed and the raw value is `undefined`, is not valid JSON,
  parses to a non-array, or (with a guard) parses to an array whose elements fail the guard
- **THEN** `parseJsonArray` returns `[]`
- **AND** it does not throw

#### Scenario: A well-formed value decodes to the typed array

- **WHEN** the raw value parses to a JSON array and (if a guard is supplied) every element
  passes the guard
- **THEN** `parseJsonArray` returns that array typed as `T[]`
- **AND** with no guard supplied, a parsed array is returned as `T[]` without per-element
  validation

### Requirement: A reactive parsed KV read on the `@/storage` seam

The `@/storage` seam SHALL provide a `useParsedStoredString<T>(key: string, parser: (raw:
string | undefined) => T): T` reactive read that composes the seam's reactive `useStoredString`
with a caller-supplied total parser, living next to `useStoredString`. It SHALL be read-only
(writes stay on the imperative setters — the seam's single-write-path posture) and SHALL
re-render its consumers when the underlying key changes, exactly as a hand-written
`parser(useStoredString(key))` pairing does. Feature hooks that read-and-parse a stored string
SHALL use this helper rather than re-writing that pairing, so the reactive-parsed-read pattern
is one helper on the seam.

#### Scenario: A parsed preference read is reactive

- **WHEN** a feature reads a stored string through `useParsedStoredString(key, parser)`
- **THEN** it receives `parser` applied to the current value of `key`
- **AND** when the value under `key` changes through the seam, the consuming component
  re-renders with the newly parsed value

### Requirement: Pure row↔domain mapper primitives on the `@/db` seam

The `src/db/` seam SHALL provide four **pure** row↔domain mapper primitives, re-exported from
`@/db`: `isoToDate(iso: string): Date`, `dateToIso(date: Date): string`,
`nullToUndef<T>(value: T | null): T | undefined`, and `undefToNull<T>(value: T | undefined): T
| null`. Feature data layers that convert between the TEXT-ISO / nullable SQLite row shape and
their ergonomic domain types SHALL use these primitives for real Date fields and for genuine
null↔undefined passthroughs, rather than re-writing the same `new Date(...)` / `.toISOString()`
/ `?? undefined` / `?? null` glue. The seam SHALL NOT provide a generic mapper factory (the
mappers stay explicit; R-2), and the primitives SHALL be applied **only** where a field is a
real Date or a null/undef passthrough — a DTO string-to-string re-canonicalization
(parse-then-serialize) is left as an explicit expression, and a nullable-date mapper keeps its
explicit null/undefined branch with the primitive supplying only the non-null conversion inside
it. Each primitive is a behavior-preserving alias of the expression it replaces.

#### Scenario: The primitives are behavior-preserving aliases

- **WHEN** a mapper converts a TEXT-ISO field or a null/undef field through a primitive
- **THEN** `isoToDate(x)` equals `new Date(x)`, `dateToIso(d)` equals `d.toISOString()`,
  `nullToUndef(v)` equals `v ?? undefined`, and `undefToNull(v)` equals `v ?? null`
- **AND** the existing mapper round-trip tests (row→domain→row identity, canonical-UTC
  normalization, null↔undefined, importer-fidelity verbatim) remain green unchanged

#### Scenario: The primitives are not forced into non-Date or non-passthrough expressions

- **WHEN** a mapper re-canonicalizes a DTO date string (parse-then-serialize) or handles a
  nullable date behind an explicit `=== null` / `=== undefined` branch
- **THEN** the DTO re-canonicalization stays an explicit expression (no primitive wrapping)
- **AND** the nullable-date branch keeps its explicit null/undefined test, with the primitive
  used only for the non-null conversion inside the branch
