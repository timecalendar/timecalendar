import { readFileSync } from "node:fs"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"

import {
  createMigrationRepository,
  type MigrationSqlite,
  type SqlValue,
} from "@/db/legacy-migration"

export function openMigrationTestDatabase(path = ":memory:") {
  const database = new DatabaseSync(path)
  const adapter: MigrationSqlite = {
    runSync(sql: string, ...values: SqlValue[]) {
      return database.prepare(sql).run(...values)
    },
    getFirstSync<T>(sql: string, ...values: SqlValue[]) {
      return (database.prepare(sql).get(...values) as T | undefined) ?? null
    },
    getAllSync<T>(sql: string, ...values: SqlValue[]) {
      return database.prepare(sql).all(...values) as T[]
    },
    withTransactionSync(task: () => void) {
      database.exec("BEGIN IMMEDIATE")
      try {
        task()
        database.exec("COMMIT")
      } catch (error) {
        database.exec("ROLLBACK")
        throw error
      }
    },
  }
  const folder = join(__dirname, "..", "db", "migrations")
  const journal = JSON.parse(
    readFileSync(join(folder, "meta", "_journal.json"), "utf8"),
  ) as { entries: { tag: string }[] }
  if (
    !database
      .prepare(
        "SELECT name FROM sqlite_master WHERE name = 'legacy_migration_run'",
      )
      .get()
  ) {
    for (const entry of journal.entries)
      database.exec(readFileSync(join(folder, `${entry.tag}.sql`), "utf8"))
  }
  return { database, adapter, repository: createMigrationRepository(adapter) }
}
