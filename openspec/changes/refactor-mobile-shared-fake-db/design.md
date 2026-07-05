# Design — shared Drizzle test fake (`createFakeDb`)

## The seam being faked

Repositories under test import a small slice of `@/db`:

| Repo | imports |
| --- | --- |
| `personal-events` | `db, eq, personalEvents` |
| `event-checklists` | `asc, checklistItems, db, eq` |
| `user-calendars` | `db, eq, userCalendars` |
| `calendar/sync` | `calendarEvents, db` |

`db` exposes `select().from().where().orderBy()` (thenable), `insert().values().onConflictDoUpdate()`,
`update().set().where()`, `delete().where()`, and `transaction(cb)`. The awaited chain
resolves to rows. Column tokens (`personalEvents.uid`, `checklistItems.order`, …) are
opaque identity values passed to `from` / `eq` / `asc`. The fake must reproduce exactly
this surface — nothing more.

## Public API

```ts
// src/test-support/fake-db.ts
export interface TableSpec {
  /** Column names → become `${table}.${col}` token strings on the table object. */
  columns: readonly string[]
  /** Primary-key column used to key the store Map. Defaults to "id". */
  pk?: string
}

export interface FakeDb {
  /** Object to return verbatim from `jest.mock("@/db", () => mockFake.module)`.
   *  Carries `db`, `eq`, `asc`, and one column-token object per configured table. */
  module: Record<string, unknown>
  /** Shared jest.fn spies for query-shape assertions (one per builder step). */
  spies: {
    select: jest.Mock; insert: jest.Mock; update: jest.Mock; delete: jest.Mock
    from: jest.Mock; where: jest.Mock; orderBy: jest.Mock; values: jest.Mock
    set: jest.Mock; onConflictDoUpdate: jest.Mock; transaction: jest.Mock
    eq: jest.Mock; asc: jest.Mock
  }
  /** Clear every table store and reset every spy. Call in `beforeEach`. */
  reset(): void
  /** Pre-populate a table's store with raw rows (for read-shape assertions). */
  seed(table: string, rows: Record<string, unknown>[]): void
  /** Snapshot a table store's current rows (order undefined). */
  rows(table: string): Record<string, unknown>[]
}

export function createFakeDb(config: {
  tables: Record<string, TableSpec>
}): FakeDb
```

`module` shape for e.g. `createFakeDb({ tables: { userCalendars: { columns: ["id","token"], pk: "id" } } })`:

```ts
{
  db: { select, insert, update, delete, transaction },
  eq, asc,
  userCalendars: { id: "userCalendars.id", token: "userCalendars.token" },
}
```

## The load-bearing constraint: jest.mock hoisting

`babel-plugin-jest-hoist` moves `jest.mock(...)` above the imports and forbids the factory
from referencing out-of-scope variables **unless the identifier matches `/^mock/i`**. The
existing fakes exploit this with `mockStore`. The shared helper keeps the same rule: the
consumer names the instance with a `mock` prefix so the lazy factory may close over it.

```ts
import { createFakeDb } from "@/test-support/fake-db"

// `mockFake` (mock-prefixed) is legal to reference inside the hoisted factory.
const mockFake = createFakeDb({
  tables: { checklistItems: { columns: ["uuid", "eventUid", "order"], pk: "uuid" },
            calendarEvents: { columns: ["uid"], pk: "uid" } },
})

jest.mock("@/db", () => mockFake.module)
```

Runtime order (post-transform): imports bind `createFakeDb` → `const mockFake = …` runs →
first `require("@/db")` invokes the factory → returns the **same** `mockFake.module`
(closure). Because the factory returns the *same* object every time it runs,
`jest.resetModules()` yields a fresh repository module bound to the **same** stores — which
is precisely the "on-disk SQLite survives a process restart" property the restart tests
prove.

## Stateful behaviour

A per-table `Map<pkValue, row>` is the "disk". Stores live inside the `FakeDb` closure
(the test-file-scoped `mockFake`), so `resetModules()` never clears them; only `reset()`
(in `beforeEach`) does.

- **`eq(colToken, val)`** → `{ field, val }` where `field` is the segment after the `.` in
  the `"table.field"` token. Records to `spies.eq`.
- **`asc(colToken)`** → `{ field }`. Records to `spies.asc`.
- **`select().from(tableToken).where(cond?).orderBy(order?)`** — thenable. On resolve:
  read the routed store's values, filter by `cond` (`row[field] === val`, or all when
  absent), sort ascending numerically/lexically by `order.field` when present. `from`
  routes to the store via a token→store registry; a `select()` with no `from` (never
  happens in-scope) defaults to the first table.
- **`insert(tableToken).values(rowOrRows)`** — stages `rowOrRows` (array or single).
  - `.onConflictDoUpdate({ target, set })` → upsert: `store.set(pk, { ...existing, ...staged[0], ...set })`, keyed by `pk` from staged row or `set`. Marks staged consumed.
  - awaited (`then`) → if unconsumed, write each staged row by its `pk`. Resolves `undefined`.
- **`update(tableToken).set(patch).where(cond)`** — apply `{ ...row, ...patch }` to every
  store row matching `cond`. Thenable-terminates on `.where`.
- **`delete(tableToken).where(cond)`** → delete matching rows. `delete(tableToken)` awaited
  with **no** `.where` → `store.clear()` (the sync drop / `replaceAll`). Both paths thenable.
- **`transaction(cb)`** → `spies.transaction()` then `cb(db)` — `tx` **is** the same
  instrumented `db`, so tx-scoped calls record to the shared spies.

Every builder step calls its shared `spies.*` first, then mutates — mirroring the existing
`(mockFrom(...a), builder)` idiom so `toHaveBeenCalledWith` / `invocationCallOrder` /
`toHaveBeenCalledTimes` all keep working across builder instances.

## How each consumer maps onto it

**Restart tests (behavioural, stateful):** build `mockFake` with the file's tables, write
through the freshly-required repository, `jest.resetModules()`, re-require, read back.
`event-checklists` adds the `calendarEvents` table and asserts a bare
`db.delete(calendarEvents)` (whole-table clear) leaves the checklist store intact — the
soft-ref/no-FK-cascade proof. `calendar/sync` reads the whole table via `select().from()`.

**Repository tests (shape, spies + seed):** build `mockFake`, and for read tests call
`mockFake.seed(<table>, [row])` instead of the old settable `mockRows`, then assert on
`mockFake.spies.*` (`spies.from` called with the table token, `spies.eq` with the column
token + value, `spies.onConflictDoUpdate` with `{ target, set }`, `spies.insert`
`toHaveBeenCalledTimes(3)` for the 120-row chunking, delete-before-insert via
`spies.delete.mock.invocationCallOrder[0] < spies.insert.mock.invocationCallOrder[0]`).
`beforeEach` → `mockFake.reset()`.

The token objects the tests reference (`personalEvents`, `checklistItems`, …) are imported
from the mocked `"@/db"` and are identity-equal to what the repository imports, so
`toHaveBeenCalledWith(personalEvents)` holds.

## Decisions

1. **`src/test-support/fake-db.ts`, not `jest/fake-db.ts`.** `jest/` is for
   `setupFilesAfterEnv` config files, not test imports; `src/test-support/` is the
   established home for test-imported helpers (`calendar-dense-week.ts`), reached by the
   `@/test-support/*` alias and already coverage-excluded (jest.config.js). Deviation from
   the ticket's suggested path, taken for repo-convention fidelity.
2. **No `gte` / `lte`.** No in-scope repository does a range read anymore; exporting unused
   operators is dead code (DoD). `where` stays `eq`-only; adding a range op later is a
   two-line change to the condition evaluator.
3. **`tx === db`.** One instrumented builder set serves top-level and transaction-scoped
   calls, collapsing the duplicate `mockTx*` spies the two transactional repo tests used.
4. **Fold the 3 wrapper tests, keep the sources.** `newId()` / `newEventId()` are one-line
   `randomUUID` forwards; a dedicated delegation test is cargo-cult. They stay covered
   transitively (every repository insert mints an id). Deleting the tests, not the code.

## Non-goals

- No change to any repository, `@/db` seam, or app source.
- No new spec/capability — behaviour is unchanged; no `specs/` delta.
- Not touching the `@/storage`-backed restart tests (`hidden-events`, `notifications`) —
  a different seam, out of R-2's scope.
