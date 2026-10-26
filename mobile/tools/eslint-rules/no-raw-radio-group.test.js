const { RuleTester } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const rule = require("./no-raw-radio-group")

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
    ecmaVersion: 2022,
    sourceType: "module",
  },
})

const raw = [{ messageId: "rawRadioGroup" }]

ruleTester.run("no-raw-radio-group", rule, {
  valid: [
    { code: `const node = <Pressable accessibilityRole="button" />` },
    { code: `const node = <Pressable accessibilityRole={role} />` },
    {
      code: `const node = <Pressable accessibilityRole={isAndroid ? "switch" : "button"} />`,
    },
    { code: `const node = <View role="list" />` },
    { code: `const node = <View testID="radiogroup" />` },
    {
      code: `const node = <Pressable accessibilityRole={pressable && "button"} />`,
    },
    {
      code: `const node = <Pressable accessibilityRole={"button" as const} />`,
    },
  ],
  invalid: [
    {
      code: `const node = <View accessibilityRole="radiogroup" />`,
      errors: raw,
    },
    {
      code: `const node = <Pressable accessibilityRole={"radio"} />`,
      errors: raw,
    },
    {
      code: "const node = <Pressable accessibilityRole={`radio`} />",
      errors: raw,
    },
    { code: `const node = <View role="radiogroup" />`, errors: raw },
    {
      code: `const node = <Pressable accessibilityRole={isAndroid ? "radio" : "button"} />`,
      errors: raw,
    },
    {
      code: `const node = <Pressable accessibilityRole={isAndroid && "radio"} />`,
      errors: raw,
    },
    {
      code: `const node = <Pressable accessibilityRole={role ?? "radio"} />`,
      errors: raw,
    },
    {
      code: `const node = <Pressable accessibilityRole={"radio" as const} />`,
      errors: raw,
    },
    {
      code: `const node = <View role={"radiogroup" satisfies Role} />`,
      errors: raw,
    },
  ],
})
