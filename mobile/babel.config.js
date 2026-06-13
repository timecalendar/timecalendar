// Rule rationale: .claude/rules/mobile/architecture.md (Storage section)
// Created for Drizzle's Expo migration bundling: the migrations.js bundle
// inline-imports the generated .sql files at build time, so Babel must process
// .sql via babel-plugin-inline-import. Otherwise this is the Expo default
// (babel-preset-expo) — no other custom transform.
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    plugins: [["inline-import", { extensions: [".sql"] }]],
  }
}
