/* global __dirname, describe, expect, it */
const { existsSync } = require("node:fs")
const { resolve } = require("node:path")
const { ESLint } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const localRules = require("./index")
const { rawEventColorAllowlist } = require("./raw-event-color-allowlist")

// Raising this needs a reason in review: the allowlist only shrinks.
const RAW_EVENT_COLOR_ALLOWLIST_CEILING = 1

const root = resolve(__dirname, "../..")

const eslint = new ESLint({
  cwd: root,
  overrideConfigFile: true,
  overrideConfig: [
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        parser: tsParser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { local: localRules },
      rules: { "local/no-raw-event-color": "error" },
    },
  ],
})

describe("raw-event-color allowlist", () => {
  it("never grows past its ceiling", () => {
    expect(rawEventColorAllowlist.length).toBeLessThanOrEqual(
      RAW_EVENT_COLOR_ALLOWLIST_CEILING,
    )
  })

  it("lists each file once", () => {
    expect(new Set(rawEventColorAllowlist).size).toBe(
      rawEventColorAllowlist.length,
    )
  })

  it("lists only files that exist", () => {
    expect(
      rawEventColorAllowlist.filter((path) => !existsSync(resolve(root, path))),
    ).toEqual([])
  })

  it("lists only files that still fill a view with a raw event color", async () => {
    const results = await eslint.lintFiles(rawEventColorAllowlist)
    const stale = results
      .filter(
        (result) =>
          !result.messages.some(
            (message) => message.ruleId === "local/no-raw-event-color",
          ),
      )
      .map((result) => result.filePath.slice(root.length + 1))
    expect(stale).toEqual([])
  })
})
