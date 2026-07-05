import { asc, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { openDatabaseSync } from "expo-sqlite"

import { useLiveQuery } from "./live-query"

// Thin seam over expo-sqlite + Drizzle — the single place the app opens the
// database and constructs Drizzle, so the backend stays swappable and feature
// code imports @/db, never expo-sqlite / drizzle-orm directly (lint-enforced,
// see eslint.config.js). One module-scoped handle + Drizzle instance.

// enableChangeListener is REQUIRED for the seam's useLiveQuery (./live-query) to
// update reactively: it subscribes via expo-sqlite's addDatabaseChangeListener,
// which only emits when the database is opened with change listening on. Without
// it a list built on useLiveQuery never re-renders after an insert/delete in the
// same session (it only reflects the DB on remount) — the personal-events list
// would silently miss a just-created event.
const expoDb = openDatabaseSync("timecalendar.db", {
  enableChangeListener: true,
})

export const db = drizzle(expoDb)

// Re-export only the query surface a feature consumer needs (the encoded form of
// "the feature never imports drizzle-orm"): the operators the repositories build
// queries with (from drizzle-orm), and the seam-owned coalescing reactive read
// (./live-query — a drop-in for drizzle's useLiveQuery that collapses per-row
// change bursts into a single re-query). Re-export ONLY what a consumer needs
// (R-2), not all of drizzle-orm.
export { asc, eq, useLiveQuery }

// Feature code imports the tables from @/db too, so the schema's
// drizzle-orm/sqlite-core import stays inside the seam dir. `eq` serves the by-uid
// reads/writes (personal events, calendar events, checklists); the event-checklists
// repository's ordered read adds `asc` (ADR 024 — `order BY order` asc).
export {
  calendarEvents,
  checklistItems,
  personalEvents,
  userCalendars,
} from "./schema"

// The seam's single uid generator for device-local record identities (D2/D7/ADR
// 024 folded into one) — feature code makes ids through @/db, never expo-crypto.
export { newId } from "./id"

// The four pure row↔domain mapper primitives (TEXT-ISO dates + null↔undefined
// passthroughs) the feature data mappers share — see mappers.ts.
export { dateToIso, isoToDate, nullToUndef, undefToNull } from "./mappers"
