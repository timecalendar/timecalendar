// Type for the drizzle-kit-generated migrations.js bundle (untyped JS, not
// covered by allowJs). Matches MigrationConfig consumed by
// drizzle-orm/expo-sqlite/migrator's migrate(). Regenerating migrations.js
// keeps the .js side in sync; this declaration is stable across regenerations.
declare const migrations: {
  journal: {
    entries: {
      idx: number
      when: number
      tag: string
      breakpoints: boolean
    }[]
  }
  migrations: Record<string, string>
}

export default migrations
