/* global __dirname, describe, expect, it */
const { existsSync } = require("node:fs")
const { resolve } = require("node:path")
const { ESLint } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const localRules = require("./index")
const { adHocStatusAllowlist } = require("./ad-hoc-status-allowlist")

// Raising this needs a reason in review: the allowlist only shrinks.
const AD_HOC_STATUS_ALLOWLIST_CEILING = 3

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
      rules: { "local/no-ad-hoc-status": "error" },
    },
  ],
})

describe("ad-hoc-status allowlist", () => {
  it("never grows past its ceiling", () => {
    expect(adHocStatusAllowlist.length).toBeLessThanOrEqual(
      AD_HOC_STATUS_ALLOWLIST_CEILING,
    )
  })

  it("lists each file once", () => {
    expect(new Set(adHocStatusAllowlist).size).toBe(adHocStatusAllowlist.length)
  })

  it("lists only files that exist", () => {
    expect(
      adHocStatusAllowlist.filter((path) => !existsSync(resolve(root, path))),
    ).toEqual([])
  })

  it("lists only files that still build an ad-hoc status", async () => {
    const results = await eslint.lintFiles(adHocStatusAllowlist)
    const stale = results
      .filter(
        (result) =>
          !result.messages.some(
            (message) => message.ruleId === "local/no-ad-hoc-status",
          ),
      )
      .map((result) => result.filePath.slice(root.length + 1))
    expect(stale).toEqual([])
  })
})
