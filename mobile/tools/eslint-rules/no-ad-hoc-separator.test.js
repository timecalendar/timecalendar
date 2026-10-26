const { RuleTester } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const rule = require("./no-ad-hoc-separator")

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
    ecmaVersion: 2022,
    sourceType: "module",
  },
})

const separator = [{ messageId: "adHocSeparator" }]

ruleTester.run("no-ad-hoc-separator", rule, {
  valid: [
    { code: `const a = { borderWidth: StyleSheet.hairlineWidth }` },
    { code: `const a = { height: 1 }` },
    { code: `const a = { width: StyleSheet.hairlineWidth }` },
    { code: `const a = { height: Math.max(h, StyleSheet.hairlineWidth) }` },
    { code: `const a = { [height]: StyleSheet.hairlineWidth }` },
    { code: `const a = { height: Other.hairlineWidth }` },
  ],
  invalid: [
    {
      code: `const a = { borderBottomWidth: StyleSheet.hairlineWidth }`,
      errors: separator,
    },
    {
      code: `const a = { borderTopWidth: StyleSheet.hairlineWidth }`,
      errors: separator,
    },
    {
      code: `const a = { height: StyleSheet.hairlineWidth }`,
      errors: separator,
    },
    {
      code: `const a = { "height": StyleSheet.hairlineWidth }`,
      errors: separator,
    },
    {
      code: `const styles = StyleSheet.create({ row: { borderBottomWidth: StyleSheet.hairlineWidth } })`,
      errors: separator,
    },
    {
      code: `const line = <View style={{ height: StyleSheet.hairlineWidth }} />`,
      errors: separator,
    },
  ],
})
