// Rule rationale: .claude/rules/mobile/architecture.md (Storage section)
// Created for Drizzle's Expo migration bundling: Metro must resolve .sql as a
// source extension so the generated migration files bundle. Otherwise this is
// the Expo default (getDefaultConfig) — no other customization.
const { getDefaultConfig } = require("expo/metro-config")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.resolver.sourceExts.push("sql")

module.exports = config
