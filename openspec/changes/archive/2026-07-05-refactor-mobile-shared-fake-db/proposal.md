# Shared Drizzle test fake: collapse ~200 lines of duplicated Map-backed `@/db` fakes and chainable query-builder spies into one `createFakeDb` helper (R-2)

## Why

The `mobile/` suite hand-rolls the `@/db` seam mock in eight test files, and the fakes
are near-identical (TIM-151 review, R-2):

- **3 `restart.test.ts`** each define a Map-backed stateful `@/db` fake that survives
  `jest.resetModules()` (the "on-disk survives a restart" proof). The
  `event-checklists` fake is a strict superset of the `user-calendars` one (two tables +
  a `transaction`); the `calendar/sync` fake is the same shape with a whole-table select.
- **4 `repository.test.ts`** each copy a chainable, thenable query-builder **spy** (a
  `makeBuilder()` returning `{ from, where, values, onConflictDoUpdate, set, orderBy, then }`
  wired to module-scoped `mock*` `jest.fn`s) plus, in two files, a `transaction` spy.
- **3 `id.ts` / `uid.ts` wrapper tests** each prove a one-line `newId()` delegates to
  `expo-crypto.randomUUID` — a cargo-cult unit that only re-asserts the wrapper's own body.

The duplication is real debt: any change to the `@/db` surface (a new operator, a
different upsert shape) means editing the same fake eight times, and the two fake
*styles* (stateful vs spy) have drifted apart for no reason — a stateful fake can serve
both. This is a test-infra-only cleanup: no production code and no behavioural spec
changes.

## What Changes

- **Add `mobile/src/test-support/fake-db.ts`** exporting `createFakeDb({ tables })`. It
  returns a stateful, spy-instrumented in-memory `@/db` module: a per-table `Map` "disk"
  that survives `jest.resetModules()`, honouring
  `insert` / `values` / `onConflictDoUpdate` (upsert) / `select` / `from` / `where` /
  `orderBy` / `delete` / `update` / `set` / `transaction` / thenable resolution, plus the
  `eq` and `asc` operators and one column-token object per configured table. Every builder
  step is a shared `jest.fn` so the same fake serves **both** the behavioural restart
  proofs **and** the query-shape repository assertions.
- **Rewrite the 3 `restart.test.ts`** to build their store via `createFakeDb` instead of
  an inline factory — same behavioural assertions (read-back after `resetModules`, the
  checklist-survives-`replaceAll` soft-ref proof, the drop+replace).
- **Rewrite the 4 `repository.test.ts`** onto the same `createFakeDb`, reading its exposed
  `spies` for the shape assertions (`toHaveBeenCalledWith(<table>)`, `invocationCallOrder`,
  chunk counts) and `seed()` for pre-populated read rows — same assertions, no behaviour
  change.
- **Delete the 3 `id.ts` / `uid.ts` wrapper tests.** They only prove a one-liner forwards
  to `randomUUID`; the id generators are exercised transitively wherever a repository test
  inserts a row. (The `id.ts` / `uid.ts` source files stay — only their tests are folded.)

## Decisions (see design.md)

1. **Location `src/test-support/` — not `jest/`.** The ticket suggests `mobile/jest/fake-db.ts`,
   but `jest/` holds *config-loaded* setup files (`setupFilesAfterEnv`), never test
   imports. Test-imported helpers live under `src/test-support/` (precedent:
   `calendar-dense-week.ts`), reached by the existing `@/test-support/*` alias and already
   coverage-excluded. Honouring the repo convention over the ticket's literal path.
2. **No `gte` / `lte` export.** The ticket lists them, but no in-scope repository still
   uses a range read (the `findInRange` calendar query was already removed). Exporting
   unused operators is dead code the DoD forbids; the fake's `where` stays `eq`-only and
   is trivially extensible if a range read returns.
3. **`tx` is the same instrumented `db`.** `transaction(cb)` runs `cb(db)`, so the two
   repository tests that asserted transaction-scoped `mockTx*` spies now read the shared
   `spies.delete` / `.insert` / `.values` / `.update` / `.set` — collapsing the duplicate
   spy set rather than reproducing it.

## Impact

- **Test-only.** No production source, no `@/db` seam, no `app.config.ts`, no dependency,
  no native change, no EAS-fingerprint bump.
- **Files:** `+ src/test-support/fake-db.ts`; 3 `restart.test.ts` + 4 `repository.test.ts`
  rewritten; 3 `*id.test.ts` / `uid.test.ts` deleted. Net ≈ −200 lines of duplication.
- **Verification:** `npm test` green with the same behavioural assertions (incl.
  checklist-survives-`replaceAll`), `tsc`, lint, and the K-3 coverage gate held.
- **No capability delta** — this changes no runtime behaviour, so there is no `specs/`
  change; the Architecture Book `testing.md` gets a one-line pointer to the shared fake.
