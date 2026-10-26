const { RuleTester } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const rule = require("./no-ad-hoc-header-action")

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
    ecmaVersion: 2022,
    sourceType: "module",
  },
})

const headerAction = [{ messageId: "adHocHeaderAction" }]

ruleTester.run("no-ad-hoc-header-action", rule, {
  valid: [
    {
      code: `const a = <Stack.Toolbar><Stack.Toolbar.Button /></Stack.Toolbar>`,
    },
    { code: `const a = <Stack.Toolbar placement="bottom" />` },
    { code: `const a = <Stack.Toolbar placement={"bottom"} />` },
    { code: `const a = <Toolbar placement="left" />` },
    { code: `const a = { headerTitle: "Title" }` },
    { code: `const a = { headerSearchBarOptions: { placeholder: "Search" } }` },
    { code: `const a = { ...useHeaderActions({ right: [] }) }` },
    { code: `const a = { [headerRight]: () => null }` },
  ],
  invalid: [
    { code: `const a = { headerRight: () => null }`, errors: headerAction },
    { code: `const a = { headerLeft: () => null }`, errors: headerAction },
    {
      code: `const a = { unstable_headerRightItems: () => [] }`,
      errors: headerAction,
    },
    {
      code: `const a = { unstable_headerLeftItems: () => [] }`,
      errors: headerAction,
    },
    { code: `const a = { "headerRight": () => null }`, errors: headerAction },
    {
      code: `const a = { "unstable_headerLeftItems": () => [] }`,
      errors: headerAction,
    },
    {
      code: `const a = <Stack.Screen options={{ title, headerRight: () => null }} />`,
      errors: headerAction,
    },
    {
      code: `const a = <Stack.Toolbar placement="right" />`,
      errors: headerAction,
    },
    {
      code: `const a = <Stack.Toolbar placement="left" />`,
      errors: headerAction,
    },
    {
      code: `const a = <Stack.Toolbar placement={side} />`,
      errors: headerAction,
    },
    { code: `const a = <Stack.Toolbar placement />`, errors: headerAction },
  ],
})
