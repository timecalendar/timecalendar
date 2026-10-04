import { migrate } from "drizzle-orm/expo-sqlite/migrator"

import { recordUnknownError } from "@/firebase"

import { db } from "./index"
import migrations from "./migrations/migrations"

// Rejections must reach the root readiness gate so consumers cannot read a
// partially initialized schema. Drizzle skips already-applied migrations.
export async function runMigrations(): Promise<void> {
  try {
    await migrate(db, migrations)
  } catch (error) {
    recordUnknownError(error, "Database migration failed at startup")
    throw error
  }
}
