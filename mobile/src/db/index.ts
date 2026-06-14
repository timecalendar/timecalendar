import { and, eq, gte, lte } from "drizzle-orm"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { useLiveQuery } from "drizzle-orm/expo-sqlite/query"
import { openDatabaseSync } from "expo-sqlite"

// Thin seam over expo-sqlite + Drizzle — the single place the app opens the
// database and constructs Drizzle, so the backend stays swappable and feature
// code imports @/db, never expo-sqlite / drizzle-orm directly (lint-enforced,
// see eslint.config.js). One module-scoped handle + Drizzle instance.

const expoDb = openDatabaseSync("timecalendar.db")

export const db = drizzle(expoDb)

// Re-export only the Drizzle query surface a feature consumer needs (the encoded
// form of "the feature never imports drizzle-orm"): the operators the repository
// builds queries with, and the reactive read hook the storage section names as
// the pattern features inherit. Re-export ONLY what a consumer needs (R-2), not
// all of drizzle-orm.
export { and, eq, gte, lte, useLiveQuery }

// Feature code imports the table from @/db too, so the schema's
// drizzle-orm/sqlite-core import stays inside the seam dir.
export { personalEvents } from "./schema"
