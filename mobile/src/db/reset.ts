export interface BackendResetDatabase {
  transaction(callback: (tx: BackendResetTransaction) => void): unknown
}

export interface BackendResetTransaction {
  delete(table: unknown): { run(): unknown }
}

export interface BackendResetTables {
  checklistItems: unknown
  activityLogs: unknown
  activityState: unknown
  calendarEvents: unknown
  userCalendars: unknown
  personalEvents: unknown
}

// The ONE backend-bound table list. The environment switch does not keep a second
// copy — switch.ts calls resetBackendDatabase(), which calls this — so a table
// added here is covered by the environment switch with nothing else to update.
// That matters: a table missed on this path leaves another environment's private
// schedule data on the device.
//
// Order: cache-shaped tables first, then identity and local user data. The
// Activity tables sit with calendar_events because they are the same kind of data
// — backend-bound and rebuildable by a refetch, not user-authored.
export function resetBackendDatabaseWith(
  database: BackendResetDatabase,
  tables: BackendResetTables,
): void {
  database.transaction((tx) => {
    tx.delete(tables.checklistItems).run()
    tx.delete(tables.activityLogs).run()
    tx.delete(tables.activityState).run()
    tx.delete(tables.calendarEvents).run()
    tx.delete(tables.userCalendars).run()
    tx.delete(tables.personalEvents).run()
  })
}
