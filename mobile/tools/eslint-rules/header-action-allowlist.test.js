/* global __dirname, describe, expect, it */
const { existsSync } = require("node:fs")
const { resolve } = require("node:path")
const { ESLint } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const localRules = require("./index")
const { headerActionAllowlist } = require("./header-action-allowlist")

// Raising this needs a reason in review: the allowlist only shrinks.
const HEADER_ACTION_ALLOWLIST_CEILING = 1

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
      rules: { "local/no-ad-hoc-header-action": "error" },
    },
  ],
})

describe("header-action allowlist", () => {
  it("never grows past its ceiling", () => {
    expect(headerActionAllowlist.length).toBeLessThanOrEqual(
      HEADER_ACTION_ALLOWLIST_CEILING,
    )
  })

  it("lists each file once", () => {
    expect(new Set(headerActionAllowlist).size).toBe(
      headerActionAllowlist.length,
    )
  })

  it("lists only files that exist", () => {
    expect(
      headerActionAllowlist.filter((path) => !existsSync(resolve(root, path))),
    ).toEqual([])
  })

  it("lists only files that still build a header action by hand", async () => {
    const results = await eslint.lintFiles(headerActionAllowlist)
    const stale = results
      .filter(
        (result) =>
          !result.messages.some(
            (message) => message.ruleId === "local/no-ad-hoc-header-action",
          ),
      )
      .map((result) => result.filePath.slice(root.length + 1))
    expect(stale).toEqual([])
  })
})
