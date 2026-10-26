/* global __dirname, describe, expect, it */
const { existsSync } = require("node:fs")
const { resolve } = require("node:path")
const { ESLint } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const localRules = require("./index")

const root = resolve(__dirname, "../..")

function describeCategoryAllowlist({
  name,
  ruleId,
  ruleOptions,
  allowlist,
  categoryOption,
  ceiling,
}) {
  const paths = allowlist.map(({ path }) => path)

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
        rules: { [ruleId]: ["error", ruleOptions] },
      },
    ],
  })

  describe(name, () => {
    it("covers exactly the rule's categories", () => {
      expect(Object.keys(ceiling).sort()).toEqual(
        Object.keys(categoryOption).sort(),
      )
    })

    it.each(Object.keys(ceiling))(
      "matches its %s ceiling exactly",
      (category) => {
        const count = allowlist.filter(({ categories }) =>
          categories.includes(category),
        ).length
        expect(count).toBe(ceiling[category])
      },
    )

    it("lists each file once", () => {
      expect(new Set(paths).size).toBe(paths.length)
    })

    it("lists only files that exist", () => {
      expect(paths.filter((path) => !existsSync(resolve(root, path)))).toEqual(
        [],
      )
    })

    it("lists only the rule's categories", () => {
      const unknown = allowlist.flatMap(({ path, categories }) =>
        categories
          .filter((category) => !(category in categoryOption))
          .map((category) => `${path}:${category}`),
      )
      expect(unknown).toEqual([])
    })

    it("lists only categories the file still violates", async () => {
      // lintFiles([]) lints the whole tree.
      const results = paths.length > 0 ? await eslint.lintFiles(paths) : []
      const found = new Map(
        results.map((result) => [
          result.filePath.slice(root.length + 1),
          new Set(
            result.messages
              .filter((message) => message.ruleId === ruleId)
              .map((message) => message.messageId),
          ),
        ]),
      )
      const stale = allowlist.flatMap(({ path, categories }) =>
        categories
          .filter((category) => !found.get(path)?.has(category))
          .map((category) => `${path}:${category}`),
      )
      expect(stale).toEqual([])
    })
  })
}

module.exports = { describeCategoryAllowlist }
