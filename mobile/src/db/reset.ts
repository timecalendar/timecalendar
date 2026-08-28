export interface BackendResetDatabase {
  transaction(callback: (tx: BackendResetTransaction) => void): unknown
}

export interface BackendResetTransaction {
  delete(table: unknown): { run(): unknown }
}

export interface BackendResetTables {
  checklistItems: unknown
  calendarEvents: unknown
  userCalendars: unknown
  personalEvents: unknown
}

export function resetBackendDatabaseWith(
  database: BackendResetDatabase,
  tables: BackendResetTables,
): void {
  database.transaction((tx) => {
    tx.delete(tables.checklistItems).run()
    tx.delete(tables.calendarEvents).run()
    tx.delete(tables.userCalendars).run()
    tx.delete(tables.personalEvents).run()
  })
}
