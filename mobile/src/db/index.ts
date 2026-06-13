import { drizzle } from "drizzle-orm/expo-sqlite"
import { openDatabaseSync } from "expo-sqlite"

// Thin seam over expo-sqlite + Drizzle — the single place the app opens the
// database and constructs Drizzle, so the backend stays swappable and feature
// code imports @/db, never expo-sqlite / drizzle-orm directly (lint-enforced,
// see eslint.config.js). One module-scoped handle + Drizzle instance.

const expoDb = openDatabaseSync("timecalendar.db")

export const db = drizzle(expoDb)
