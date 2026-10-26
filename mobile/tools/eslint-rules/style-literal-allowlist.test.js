/* global __dirname, describe, expect, it */
const { existsSync } = require("node:fs")
const { resolve } = require("node:path")
const { ESLint } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const localRules = require("./index")
const {
  styleLiteralAllowlist,
  styleLiteralCategoryOption,
} = require("./style-literal-allowlist")

// Raising this needs a reason in review: the allowlist only shrinks.
const STYLE_LITERAL_ALLOWLIST_CEILING = {
  colorLiteral: 1,
  typographyLiteral: 7,
  legacyShadow: 0,
  spacingLiteral: 6,
  radiusLiteral: 3,
}

const root = resolve(__dirname, "../..")
const paths = styleLiteralAllowlist.map(({ path }) => path)

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
        "local/no-style-literals": [
          "error",
          {
            colors: true,
            typography: true,
            shadows: true,
            spacing: true,
            radius: true,
          },
        ],
      },
    },
  ],
})

describe("style-literal allowlist", () => {
  it("covers exactly the rule's categories", () => {
    expect(Object.keys(STYLE_LITERAL_ALLOWLIST_CEILING).sort()).toEqual(
      Object.keys(styleLiteralCategoryOption).sort(),
    )
  })

  it.each(Object.keys(STYLE_LITERAL_ALLOWLIST_CEILING))(
    "never grows past its %s ceiling",
    (category) => {
      const count = styleLiteralAllowlist.filter(({ categories }) =>
        categories.includes(category),
      ).length
      expect(count).toBeLessThanOrEqual(
        STYLE_LITERAL_ALLOWLIST_CEILING[category],
      )
    },
  )

  it("lists each file once", () => {
    expect(new Set(paths).size).toBe(paths.length)
  })

  it("lists only files that exist", () => {
    expect(paths.filter((path) => !existsSync(resolve(root, path)))).toEqual([])
  })

  it("lists only the rule's categories", () => {
    const unknown = styleLiteralAllowlist.flatMap(({ path, categories }) =>
      categories
        .filter((category) => !(category in styleLiteralCategoryOption))
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
            .filter((message) => message.ruleId === "local/no-style-literals")
            .map((message) => message.messageId),
        ),
      ]),
    )
    const stale = styleLiteralAllowlist.flatMap(({ path, categories }) =>
      categories
        .filter((category) => !found.get(path)?.has(category))
        .map((category) => `${path}:${category}`),
    )
    expect(stale).toEqual([])
  })
})
