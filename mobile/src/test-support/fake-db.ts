// A shared, stateful in-memory fake of the `@/db` seam for the repository +
// restart tests (TIM-151 R-2 — collapses ~200 lines of near-identical hand-rolled
// `jest.mock("@/db", …)` factories). It reproduces exactly the Drizzle slice the
// repositories touch — `select().from().where().orderBy()` (thenable),
// `insert().values().onConflictDoUpdate()`, `update().set().where()`,
// `delete().where()`, `transaction(cb)`, plus the `eq`/`asc` operators and one
// column-token object per table — nothing more. Each table's rows live in a
// per-table Map "disk" held inside the returned `FakeDb` closure, so
// `jest.resetModules()` (a simulated process restart) never clears them; only
// `reset()` (in `beforeEach`) does. Every builder step is a shared `jest.fn`, so
// query-shape assertions (`toHaveBeenCalledWith(<table>)`, `invocationCallOrder`,
// chunk counts) aggregate across builder instances the same way the old inline
// spies did.
//
// CONSUMER HOISTING RULE: `babel-plugin-jest-hoist` lifts `jest.mock(...)` above
// the imports and forbids the factory from closing over out-of-scope variables
// UNLESS the identifier matches /^mock/i. So name the instance with a `mock`
// prefix and hand `.module` straight to the factory:
//
//     import { createFakeDb } from "@/test-support/fake-db"
//     const mockFake = createFakeDb({ tables: { … } })
//     jest.mock("@/db", () => mockFake.module)
//
// It lives under `src/test-support/` (not `jest/`) because `jest/` is for
// config-loaded `setupFilesAfterEnv` files, never test imports — test-imported
// helpers belong here (precedent: `calendar-dense-week.ts`), reached by the
// `@/test-support/*` alias and already coverage-excluded (jest.config.js).

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
    select: jest.Mock
    insert: jest.Mock
    update: jest.Mock
    delete: jest.Mock
    from: jest.Mock
    where: jest.Mock
    orderBy: jest.Mock
    values: jest.Mock
    set: jest.Mock
    onConflictDoUpdate: jest.Mock
    transaction: jest.Mock
    eq: jest.Mock
    asc: jest.Mock
  }
  /** Clear every table store and reset every spy. Call in `beforeEach`. */
  reset(): void
  /** Pre-populate a table's store with raw rows (for read-shape assertions). */
  seed(table: string, rows: Record<string, unknown>[]): void
}

type Row = Record<string, unknown>
// A resolved `eq()` condition, or null for a where-less read/write.
type Condition = { field: string; val: unknown } | null
// A resolved `asc()` order.
type Order = { field: string }

export function createFakeDb(config: {
  tables: Record<string, TableSpec>
}): FakeDb {
  const names = Object.keys(config.tables)
  // The "disk": a Map<pkValue, row> per table, keyed by the table NAME. Held in
  // this closure so jest.resetModules() (the restart) never clears it.
  const stores = new Map<string, Map<string, Row>>()
  const pks = new Map<string, string>()
  // The identity-equal table-token object each consumer imports from the mocked
  // "@/db"; `from`/`insert`/`update`/`delete` receive it and it routes to a store.
  const tokens = new Map<string, Record<string, string>>()
  // token object → table name, so a builder can route by identity.
  const tokenToName = new Map<Record<string, string>, string>()

  for (const name of names) {
    const spec = config.tables[name]!
    stores.set(name, new Map())
    pks.set(name, spec.pk ?? "id")
    const token: Record<string, string> = {}
    for (const col of spec.columns) token[col] = `${name}.${col}`
    tokens.set(name, token)
    tokenToName.set(token, name)
  }

  const storeOf = (token: unknown): Map<string, Row> =>
    stores.get(tokenToName.get(token as Record<string, string>) ?? names[0]!)!
  const pkOf = (token: unknown): string =>
    pks.get(tokenToName.get(token as Record<string, string>) ?? names[0]!)!

  const matches = (row: Row, cond: Condition): boolean =>
    cond === null || row[cond.field] === cond.val

  const spies: FakeDb["spies"] = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    values: jest.fn(),
    set: jest.fn(),
    onConflictDoUpdate: jest.fn(),
    transaction: jest.fn(),
    eq: jest.fn(),
    asc: jest.fn(),
  }

  // The segment after the "." in a "table.field" column token.
  const fieldOf = (token: string): string => token.split(".").pop() ?? token

  const eq = (col: string, val: unknown): Condition => {
    spies.eq(col, val)
    return { field: fieldOf(col), val }
  }
  const asc = (col: string): Order => {
    spies.asc(col)
    return { field: fieldOf(col) }
  }

  const makeSelect = (): Record<string, unknown> => {
    let store = stores.get(names[0]!)!
    let cond: Condition = null
    let order: Order | null = null
    const builder: Record<string, unknown> = {
      from: (token: unknown) => {
        spies.from(token)
        store = storeOf(token)
        return builder
      },
      where: (c: Condition) => {
        spies.where(c)
        cond = c
        return builder
      },
      orderBy: (o: Order) => {
        spies.orderBy(o)
        order = o
        return builder
      },
      then: (resolve: (rows: Row[]) => unknown) => {
        const rows = [...store.values()].filter((row) => matches(row, cond))
        if (order !== null) {
          const f = order.field
          rows.sort((a, b) => {
            const [x, y] = [a[f], b[f]]
            if (typeof x === "number" && typeof y === "number") return x - y
            return String(x).localeCompare(String(y))
          })
        }
        return resolve(rows)
      },
    }
    return builder
  }

  const makeInsert = (token: unknown): Record<string, unknown> => {
    const store = storeOf(token)
    const pk = pkOf(token)
    let staged: Row[] = []
    let consumed = false
    const builder: Record<string, unknown> = {
      values: (rowOrRows: Row | Row[]) => {
        spies.values(rowOrRows)
        staged = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows]
        return builder
      },
      onConflictDoUpdate: ({ target, set }: { target: unknown; set: Row }) => {
        spies.onConflictDoUpdate({ target, set })
        // Upsert by pk: insert when absent, overwrite when present (Flutter put).
        const first = staged[0] ?? {}
        const key = String(first[pk] ?? set[pk])
        store.set(key, { ...store.get(key), ...first, ...set })
        consumed = true
        return builder
      },
      then: (resolve: (v: unknown) => unknown) => {
        if (!consumed) {
          for (const row of staged) store.set(String(row[pk]), { ...row })
        }
        return resolve(undefined)
      },
    }
    return builder
  }

  const makeUpdate = (token: unknown): Record<string, unknown> => {
    const store = storeOf(token)
    let patch: Row = {}
    const builder: Record<string, unknown> = {
      set: (p: Row) => {
        spies.set(p)
        patch = p
        return builder
      },
      where: (c: Condition) => {
        spies.where(c)
        for (const [key, row] of store) {
          if (matches(row, c)) store.set(key, { ...row, ...patch })
        }
        return { then: (r: (v: unknown) => unknown) => r(undefined) }
      },
    }
    return builder
  }

  const makeDelete = (token: unknown): Record<string, unknown> => {
    const store = storeOf(token)
    const builder: Record<string, unknown> = {
      where: (c: Condition) => {
        spies.where(c)
        for (const [key, row] of store) {
          if (matches(row, c)) store.delete(key)
        }
        return { then: (r: (v: unknown) => unknown) => r(undefined) }
      },
      // delete(table) awaited with NO where: clear the whole table (the sync drop
      // / replaceAll's drop step).
      then: (resolve: (v: unknown) => unknown) => {
        store.clear()
        return resolve(undefined)
      },
    }
    return builder
  }

  const db: Record<string, unknown> = {
    select: (...a: unknown[]) => {
      spies.select(...a)
      return makeSelect()
    },
    insert: (token: unknown) => {
      spies.insert(token)
      return makeInsert(token)
    },
    update: (token: unknown) => {
      spies.update(token)
      return makeUpdate(token)
    },
    delete: (token: unknown) => {
      spies.delete(token)
      return makeDelete(token)
    },
    // tx IS the same instrumented db: transaction-scoped calls record to the
    // shared spies (design decision 3 — collapses the old mockTx* spy set).
    transaction: (cb: (tx: unknown) => Promise<unknown>) => {
      spies.transaction()
      return cb(db)
    },
  }

  const module: Record<string, unknown> = { db, eq, asc }
  for (const name of names) module[name] = tokens.get(name)!

  return {
    module,
    spies,
    reset() {
      for (const store of stores.values()) store.clear()
      for (const spy of Object.values(spies)) spy.mockClear()
    },
    seed(table: string, rows: Row[]) {
      const store = stores.get(table)!
      const pk = pks.get(table)!
      for (const row of rows) store.set(String(row[pk]), { ...row })
    },
  }
}
