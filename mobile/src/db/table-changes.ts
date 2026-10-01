import { getTableConfig, type SQLiteTable } from "drizzle-orm/sqlite-core"
import { addDatabaseChangeListener } from "expo-sqlite"

/**
 * Calls `listener` once after each burst of changes to any of `tables`.
 * expo-sqlite emits one event per changed row, so a bulk write would otherwise
 * trigger one re-read per row; a trailing macrotask collapses the burst.
 */
export function subscribeToTableChanges(
  tables: readonly SQLiteTable[],
  listener: () => void,
): () => void {
  const names = new Set(tables.map((table) => getTableConfig(table).name))
  let timer: ReturnType<typeof setTimeout> | undefined
  const subscription = addDatabaseChangeListener(({ tableName }) => {
    if (!names.has(tableName)) return
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      listener()
    }, 0)
  })
  return () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    subscription.remove()
  }
}
