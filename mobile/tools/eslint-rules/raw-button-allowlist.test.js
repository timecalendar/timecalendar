/* global __dirname, describe, expect, it */
const { existsSync } = require("node:fs")
const { resolve } = require("node:path")
const { ESLint } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const localRules = require("./index")
const { rawButtonAllowlist } = require("./raw-button-allowlist")

// Raising this needs a reason in review: the allowlist only shrinks.
const RAW_BUTTON_ALLOWLIST_CEILING = 16

const root = resolve(__dirname, "../..")

const eslint = new ESLint({
  cwd: root,
  overrideConfigFile: true,
  overrideConfig: [
    {
      files: ["**/*.tsx"],
      languageOptions: {
        parser: tsParser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { local: localRules },
      rules: { "local/no-raw-button": "error" },
    },
  ],
})

describe("raw-button allowlist", () => {
  it("never grows past its ceiling", () => {
    expect(rawButtonAllowlist.length).toBeLessThanOrEqual(
      RAW_BUTTON_ALLOWLIST_CEILING,
    )
  })

  it("lists each file once", () => {
    expect(new Set(rawButtonAllowlist).size).toBe(rawButtonAllowlist.length)
  })

  it("lists only files that exist", () => {
    expect(
      rawButtonAllowlist.filter((path) => !existsSync(resolve(root, path))),
    ).toEqual([])
  })

  it("lists only files that still build a raw text button", async () => {
    const results = await eslint.lintFiles(rawButtonAllowlist)
    const stale = results
      .filter(
        (result) =>
          !result.messages.some(
            (message) => message.ruleId === "local/no-raw-button",
          ),
      )
      .map((result) => result.filePath.slice(root.length + 1))
    expect(stale).toEqual([])
  })
})
