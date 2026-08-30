import { getTableConfig } from "drizzle-orm/sqlite-core"

import { activityLogs, activityState } from "./schema"

// The declared-schema half of the index proof. `migrations.sqlite.test.ts` proves
// the committed SQL creates the indexes in a real database; this proves the
// Drizzle schema still DECLARES them, so a future edit that drops an index from
// schema.ts is caught here rather than silently generating a migration nobody
// notices. Drizzle evaluates the third-argument extras callback lazily, which is
// why reading the table config is what exercises it.
//
// This file imports drizzle-orm/sqlite-core (lint-banned outside src/db/**),
// which is why it lives in the @/db seam dir alongside the schema.

describe("activity_logs indexes", () => {
  const { indexes } = getTableConfig(activityLogs)

  const columnsOf = (name: string): string[] =>
    indexes
      .find((index) => index.config.name === name)!
      .config.columns.map((column) => (column as { name: string }).name)

  it("declares exactly the two indexes the read paths need", () => {
    expect(indexes.map((index) => index.config.name).sort()).toEqual([
      "activity_logs_calendar_id_idx",
      "activity_logs_created_at_idx",
    ])
  })

  // created_at serves the newest-first read AND the one-year age prune;
  // calendar_id serves the ownership prune.
  it("indexes created_at and calendar_id", () => {
    expect(columnsOf("activity_logs_created_at_idx")).toEqual(["created_at"])
    expect(columnsOf("activity_logs_calendar_id_idx")).toEqual(["calendar_id"])
  })
})

describe("activity_state", () => {
  const { columns, indexes } = getTableConfig(activityState)

  it("is a bare singleton table with no index", () => {
    expect(indexes).toEqual([])
  })

  // The frozen six columns — no seventh (the prune cutoff is derived from the
  // two timestamp sources, not stored).
  it("declares exactly the six frozen columns", () => {
    expect(columns.map((column) => column.name).sort()).toEqual([
      "id",
      "last_read_at",
      "last_successful_refresh_at",
      "older_page_complete",
      "older_page_cursor",
      "unread_count",
    ])
  })
})
