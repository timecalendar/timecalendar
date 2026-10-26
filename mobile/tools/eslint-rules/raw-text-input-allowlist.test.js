/* global __dirname, describe, expect, it */
const { existsSync } = require("node:fs")
const { resolve } = require("node:path")
const { ESLint } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const localRules = require("./index")
const { rawTextInputAllowlist } = require("./raw-text-input-allowlist")

// Raising this needs a reason in review: the allowlist only shrinks.
const RAW_TEXT_INPUT_ALLOWLIST_CEILING = 1

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
      rules: { "local/no-raw-text-input": "error" },
    },
  ],
})

describe("raw-text-input allowlist", () => {
  it("never grows past its ceiling", () => {
    expect(rawTextInputAllowlist.length).toBeLessThanOrEqual(
      RAW_TEXT_INPUT_ALLOWLIST_CEILING,
    )
  })

  it("lists each file once", () => {
    expect(new Set(rawTextInputAllowlist).size).toBe(
      rawTextInputAllowlist.length,
    )
  })

  it("lists only files that exist", () => {
    expect(
      rawTextInputAllowlist.filter((path) => !existsSync(resolve(root, path))),
    ).toEqual([])
  })

  it("lists only files that still render a raw TextInput", async () => {
    const results = await eslint.lintFiles(rawTextInputAllowlist)
    const stale = results
      .filter(
        (result) =>
          !result.messages.some(
            (message) => message.ruleId === "local/no-raw-text-input",
          ),
      )
      .map((result) => result.filePath.slice(root.length + 1))
    expect(stale).toEqual([])
  })
})
