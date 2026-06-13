import { defineConfig } from "drizzle-kit"

// Drizzle Kit config for the expo-sqlite store (src/db). `driver: "expo"` makes
// `drizzle-kit generate` emit the Expo-compatible migration bundle into
// src/db/migrations. The `schema` path is reserved for the first feature's
// Drizzle schema — the file need not exist yet (no feature tables this step),
// so `npm run generate:migrations` emits nothing until a schema lands.
export default defineConfig({
  dialect: "sqlite",
  driver: "expo",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
})
