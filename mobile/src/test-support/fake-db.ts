// A shared, stateful in-memory fake of the `@/db` seam for the repository +
// restart tests (TIM-151 R-2 — collapses ~200 lines of near-identical hand-rolled
// `jest.mock("@/db", …)` factories). It reproduces exactly the Drizzle slice the
// repositories touch — `select().from().where().orderBy().limit()` (thenable,
// plus the synchronous `.all()` executor), `insert().values().onConflictDoUpdate()`,
// `update().set().where()`, `delete().where()`, `transaction(cb)`, plus the
// `eq`/`lt`/`inArray`/`notInArray`/`asc`/`desc` operators, projected selects,
// reactive reads, and one
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
   *  Carries `db`, the operators, and one column-token object per configured table. */
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
    limit: jest.Mock
    values: jest.Mock
    set: jest.Mock
    onConflictDoUpdate: jest.Mock
    transaction: jest.Mock
    eq: jest.Mock
    asc: jest.Mock
    desc: jest.Mock
    lt: jest.Mock
    inArray: jest.Mock
    notInArray: jest.Mock
    sql: jest.Mock
    useLiveQuery: jest.Mock
  }
  /** Clear every table store and reset every spy. Call in `beforeEach`. */
  reset(): void
  /** Pre-populate a table's store with raw rows (for read-shape assertions). */
  seed(table: string, rows: Record<string, unknown>[]): void
  /** Number of currently mounted reactive-query consumers. */
  liveQueryListenerCount(): number
}

type Row = Record<string, unknown>
// A resolved condition — one operator applied to one column, or `null` for a
// where-less read/write. Each operator resolves to its own leaf, so the
// `spies.<op>(col, val)` contract consumers assert on is per-operator.
type Condition =
  | { op: "eq" | "lt"; field: string; val: unknown }
  | { op: "inArray"; field: string; val: readonly unknown[] }
  | { op: "notInArray"; field: string; val: readonly unknown[] }
  | { op: "alwaysFalse" }
  | null
// A resolved `asc()` / `desc()` order. `orderBy` takes one or more.
type Order = { field: string; dir: "asc" | "desc" }

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
  const listeners = new Set<() => void>()
  let version = 0

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

  // Ordering/comparison mirrors SQLite closely enough for the columns the
  // repositories use: numbers compare numerically, everything else compares as
  // text. Canonical UTC ISO-8601 date TEXT (the schema's posture) sorts
  // chronologically either way, which is what the Activity newest-first read and
  // the one-year age cutoff rely on.
  const compare = (x: unknown, y: unknown): number => {
    if (typeof x === "number" && typeof y === "number") return x - y
    return String(x).localeCompare(String(y))
  }

  const matches = (row: Row, cond: Condition): boolean => {
    if (cond === null) return true
    switch (cond.op) {
      case "eq":
        return row[cond.field] === cond.val
      case "lt":
        return compare(row[cond.field], cond.val) < 0
      case "inArray":
        return cond.val.includes(row[cond.field])
      case "notInArray":
        return !cond.val.includes(row[cond.field])
      case "alwaysFalse":
        return false
    }
  }

  const spies: FakeDb["spies"] = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    values: jest.fn(),
    set: jest.fn(),
    onConflictDoUpdate: jest.fn(),
    transaction: jest.fn(),
    eq: jest.fn(),
    asc: jest.fn(),
    desc: jest.fn(),
    lt: jest.fn(),
    inArray: jest.fn(),
    notInArray: jest.fn(),
    sql: jest.fn(),
    useLiveQuery: jest.fn(),
  }

  // The segment after the "." in a "table.field" column token.
  const fieldOf = (token: string): string => token.split(".").pop() ?? token

  const eq = (col: string, val: unknown): Condition => {
    spies.eq(col, val)
    return { op: "eq", field: fieldOf(col), val }
  }
  const lt = (col: string, val: unknown): Condition => {
    spies.lt(col, val)
    return { op: "lt", field: fieldOf(col), val }
  }
  const inArray = (col: string, val: readonly unknown[]): Condition => {
    spies.inArray(col, val)
    return { op: "inArray", field: fieldOf(col), val }
  }
  const notInArray = (col: string, val: readonly unknown[]): Condition => {
    spies.notInArray(col, val)
    return { op: "notInArray", field: fieldOf(col), val }
  }
  const asc = (col: string): Order => {
    spies.asc(col)
    return { field: fieldOf(col), dir: "asc" }
  }
  const desc = (col: string): Order => {
    spies.desc(col)
    return { field: fieldOf(col), dir: "desc" }
  }

  const notify = (): void => {
    version += 1
    for (const listener of listeners) listener()
  }

  const makeSelect = (
    projection?: Record<string, string>,
  ): Record<string, unknown> => {
    let store = stores.get(names[0]!)!
    let cond: Condition = null
    let orders: Order[] = []
    let take: number | null = null
    // Filter, then sort by each order key in turn (the Activity read is
    // `orderBy(desc(created_at), desc(id))` — the second key breaks ties on the
    // first), then apply the limit.
    const rows = (): Row[] => {
      const result = [...store.values()].filter((row) => matches(row, cond))
      if (orders.length > 0) {
        result.sort((a, b) => {
          for (const order of orders) {
            const sign = order.dir === "desc" ? -1 : 1
            const delta = compare(a[order.field], b[order.field]) * sign
            if (delta !== 0) return delta
          }
          return 0
        })
      }
      const selected = take === null ? result : result.slice(0, take)
      if (projection === undefined) return selected
      return selected.map((row) =>
        Object.fromEntries(
          Object.entries(projection).map(([key, token]) => [
            key,
            row[fieldOf(token)],
          ]),
        ),
      )
    }
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
      orderBy: (...o: Order[]) => {
        spies.orderBy(...o)
        orders = o
        return builder
      },
      limit: (n: number) => {
        spies.limit(n)
        take = n
        return builder
      },
      then: (resolve: (result: Row[]) => unknown) => resolve(rows()),
      // The SYNCHRONOUS read executor. drizzle-orm/expo-sqlite is a 'sync'
      // session, so `.all()` returns rows without a promise — which is the only
      // way to read inside a synchronous transaction callback (the Activity page
      // write reads its state row and its newest cached timestamp there).
      all: rows,
    }
    return builder
  }

  const makeInsert = (token: unknown): Record<string, unknown> => {
    const store = storeOf(token)
    const pk = pkOf(token)
    let staged: Row[] = []
    let consumed = false
    // Insert the staged rows (unless an onConflict path already consumed them).
    // Shared by the awaited (`then`) and synchronous (`run`) executors — the
    // repositories that write inside a synchronous transaction call `.run()`.
    const flush = () => {
      if (!consumed) {
        for (const row of staged) store.set(String(row[pk]), { ...row })
      }
    }
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
        flush()
        notify()
        return resolve(undefined)
      },
      run: () => {
        flush()
        notify()
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
      // The mutation is applied here; `then`/`run` are terminal no-ops (the
      // synchronous-transaction `reorder` uses `.run()`, the awaited writers `.then`).
      where: (c: Condition) => {
        spies.where(c)
        for (const [key, row] of store) {
          if (matches(row, c)) store.set(key, { ...row, ...patch })
        }
        return {
          then: (r: (v: unknown) => unknown) => {
            notify()
            return r(undefined)
          },
          run: notify,
        }
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
        return {
          then: (r: (v: unknown) => unknown) => {
            notify()
            return r(undefined)
          },
          run: notify,
        }
      },
      // delete(table) with NO where: clear the whole table (the sync drop /
      // replaceAll's drop step). `run` is the synchronous-transaction executor,
      // `then` the awaited one.
      then: (resolve: (v: unknown) => unknown) => {
        store.clear()
        notify()
        return resolve(undefined)
      },
      run: () => {
        store.clear()
        notify()
      },
    }
    return builder
  }

  const db: Record<string, unknown> = {
    select: (projection?: Record<string, string>) => {
      spies.select(projection)
      return makeSelect(projection)
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
    // shared spies (design decision 3 — collapses the old mockTx* spy set). The
    // callback is passed to the spy so a test can assert the synchronous form (a
    // non-async callback — the expo driver never awaits, so an async one would
    // break atomicity). Called synchronously (no await), mirroring the sync driver.
    transaction: (cb: (tx: unknown) => unknown) => {
      spies.transaction(cb)
      return cb(db)
    },
  }

  const sql = (parts: TemplateStringsArray): Condition => {
    spies.sql(parts)
    return { op: "alwaysFalse" }
  }
  const useLiveQuery = (query: { all: () => Row[] }, deps: unknown[]) => {
    spies.useLiveQuery(query, deps)
    const React = jest.requireActual<typeof import("react")>("react")
    React.useSyncExternalStore(
      (listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
      () => version,
      () => version,
    )
    return { data: query.all() }
  }

  const module: Record<string, unknown> = {
    db,
    eq,
    asc,
    desc,
    lt,
    inArray,
    notInArray,
    sql,
    useLiveQuery,
  }
  for (const name of names) module[name] = tokens.get(name)!

  return {
    module,
    spies,
    reset() {
      for (const store of stores.values()) store.clear()
      listeners.clear()
      version = 0
      for (const spy of Object.values(spies)) spy.mockClear()
    },
    seed(table: string, rows: Row[]) {
      const store = stores.get(table)!
      const pk = pks.get(table)!
      for (const row of rows) store.set(String(row[pk]), { ...row })
    },
    liveQueryListenerCount() {
      return listeners.size
    },
  }
}
