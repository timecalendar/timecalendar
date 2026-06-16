import { and, asc, eq, gte, lte } from "drizzle-orm"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useLiveQuery } from "drizzle-orm/expo-sqlite/query"
import { openDatabaseSync } from "expo-sqlite"

// Thin seam over expo-sqlite + Drizzle — the single place the app opens the
// database and constructs Drizzle, so the backend stays swappable and feature
// code imports @/db, never expo-sqlite / drizzle-orm directly (lint-enforced,
// see eslint.config.js). One module-scoped handle + Drizzle instance.

// enableChangeListener is REQUIRED for drizzle's useLiveQuery to update
// reactively: it subscribes via expo-sqlite's addDatabaseChangeListener, which
// only emits when the database is opened with change listening on. Without it a
// list built on useLiveQuery never re-renders after an insert/delete in the same
// session (it only reflects the DB on remount) — the personal-events list would
// silently miss a just-created event.
const expoDb = openDatabaseSync("timecalendar.db", {
  enableChangeListener: true,
})

export const db = drizzle(expoDb)

// Re-export only the Drizzle query surface a feature consumer needs (the encoded
// form of "the feature never imports drizzle-orm"): the operators the repository
// builds queries with, and the reactive read hook the storage section names as
// the pattern features inherit. Re-export ONLY what a consumer needs (R-2), not
// all of drizzle-orm.
export { and, asc, eq, gte, lte, useLiveQuery }

// Feature code imports the tables from @/db too, so the schema's
// drizzle-orm/sqlite-core import stays inside the seam dir. The calendar-sync
// repository's findInRange reuses `and`/`gte`/`lte` (already re-exported above
// for personal-events). The event-checklists repository's ordered read adds the
// single new operator `asc` (ADR 024 — `order BY order` asc; R-2: re-export only
// what a consumer needs).
export {
  calendarEvents,
  checklistItems,
  personalEvents,
  userCalendars,
} from "./schema"
