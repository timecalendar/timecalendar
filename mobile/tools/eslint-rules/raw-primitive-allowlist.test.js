/* global __dirname, describe, expect, it */
const { existsSync } = require("node:fs")
const { resolve } = require("node:path")
const { ESLint } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const localRules = require("./index")
const {
  rawPrimitiveAllowlist,
  rawPrimitiveCategoryOption,
} = require("./raw-primitive-allowlist")

// Raising this needs a reason in review: the allowlist only shrinks.
const RAW_PRIMITIVE_ALLOWLIST_CEILING = { rawText: 1, rawModal: 0 }

const root = resolve(__dirname, "../..")
const paths = rawPrimitiveAllowlist.map(({ path }) => path)

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
      rules: {
        "local/no-raw-primitive": ["error", { text: true, modal: true }],
      },
    },
  ],
})

describe("raw-primitive allowlist", () => {
  it("covers exactly the rule's categories", () => {
    expect(Object.keys(RAW_PRIMITIVE_ALLOWLIST_CEILING).sort()).toEqual(
      Object.keys(rawPrimitiveCategoryOption).sort(),
    )
  })

  it.each(Object.keys(RAW_PRIMITIVE_ALLOWLIST_CEILING))(
    "matches its %s ceiling exactly",
    (category) => {
      const count = rawPrimitiveAllowlist.filter(({ categories }) =>
        categories.includes(category),
      ).length
      expect(count).toBe(RAW_PRIMITIVE_ALLOWLIST_CEILING[category])
    },
  )

  it("lists each file once", () => {
    expect(new Set(paths).size).toBe(paths.length)
  })

  it("lists only files that exist", () => {
    expect(paths.filter((path) => !existsSync(resolve(root, path)))).toEqual([])
  })

  it("lists only the rule's categories", () => {
    const unknown = rawPrimitiveAllowlist.flatMap(({ path, categories }) =>
      categories
        .filter((category) => !(category in rawPrimitiveCategoryOption))
        .map((category) => `${path}:${category}`),
    )
    expect(unknown).toEqual([])
  })

  it("lists only categories the file still violates", async () => {
    const results = await eslint.lintFiles(paths)
    const found = new Map(
      results.map((result) => [
        result.filePath.slice(root.length + 1),
        new Set(
          result.messages
            .filter((message) => message.ruleId === "local/no-raw-primitive")
            .map((message) => message.messageId),
        ),
      ]),
    )
    const stale = rawPrimitiveAllowlist.flatMap(({ path, categories }) =>
      categories
        .filter((category) => !found.get(path)?.has(category))
        .map((category) => `${path}:${category}`),
    )
    expect(stale).toEqual([])
  })
})
