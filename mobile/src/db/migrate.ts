import { migrate } from "drizzle-orm/expo-sqlite/migrator"

import { recordError } from "@/firebase"

import { db } from "./index"
import migrations from "./migrations/migrations"

// Startup migration runner. Non-hook (plain async): migrations are
// infrastructure, not UI — testable in isolation and invokable from the
// _layout side-effect, decoupled from any React render. migrate() creates and
// advances Drizzle's __drizzle_migrations tracking table, applying the committed
// bundle (the personal_events / user_calendars / calendar_events / checklist_items
// migrations) up to the current version; already-applied migrations are skipped, so
// re-running is idempotent. A failure is crash-worthy, so it is recorded through the
// @/firebase observability seam rather than swallowed.
//
// The first feature whose initial read must wait on its tables can adopt
// useMigrations() (the hook form) to gate a loading screen instead.
export async function runMigrations(): Promise<void> {
  try {
    await migrate(db, migrations)
  } catch (error) {
    recordError(
      error instanceof Error ? error : new Error(String(error)),
      "Database migration failed at startup",
    )
  }
}
