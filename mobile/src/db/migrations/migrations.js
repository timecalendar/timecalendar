// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo
//
// EMPTY migration bundle this foundation step — zero feature migrations (D4).
// This is the exact shape `drizzle-kit generate` (driver "expo") emits, minus
// any .sql imports, so the runner has a real, valid bundle to apply against a
// fresh DB: it creates Drizzle's __drizzle_migrations tracking table and leaves
// the database at version 0. The first feature regenerates this file with
// `npm run generate:migrations` once it adds a schema — do not hand-add tables.
import journal from "./meta/_journal.json"

export default {
  journal,
  migrations: {},
}
