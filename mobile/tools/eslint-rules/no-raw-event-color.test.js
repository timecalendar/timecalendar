const { RuleTester } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const rule = require("./no-raw-event-color")

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
    ecmaVersion: 2022,
    sourceType: "module",
  },
})

const rawEventColor = [{ messageId: "rawEventColor" }]
const eventAppearanceCall = [{ messageId: "eventAppearanceCall" }]

ruleTester.run("no-raw-event-color", rule, {
  valid: [
    { code: `const a = { backgroundColor: theme.primary }` },
    { code: `const a = { backgroundColor: theme.color }` },
    { code: `const a = { backgroundColor: hex }` },
    { code: `const a = { backgroundColor: mix(event.color) }` },
    { code: `const a = { borderLeftColor: theme.primary }` },
    { code: `const a = { borderStartColor: theme.color }` },
    { code: `const a = resolveAppearance({ color: event.color })` },
    { code: `const a = theme[resolveEventAppearance]` },
    { code: `const a = { color: row.color }` },
    { code: `const a = { [key]: event.color }` },
    { code: `const a = { backgroundColor: event["color"] }` },
    { code: `const a = { borderColor: event.colour }` },
  ],
  invalid: [
    {
      code: `const dot = <View style={{ backgroundColor: event.color }} />`,
      errors: rawEventColor,
    },
    { code: `const a = { backgroundColor: tag.color }`, errors: rawEventColor },
    {
      code: `const a = { backgroundColor: item?.color }`,
      errors: rawEventColor,
    },
    { code: `const a = { borderColor: event.color }`, errors: rawEventColor },
    {
      code: `const a = { "backgroundColor": props.event.color }`,
      errors: rawEventColor,
    },
    {
      code: `const a = { borderLeftColor: event.color }`,
      errors: rawEventColor,
    },
    {
      code: `const a = { borderStartColor: item?.color }`,
      errors: rawEventColor,
    },
    ...[
      "borderRightColor",
      "borderTopColor",
      "borderBottomColor",
      "borderEndColor",
    ].map((key) => ({
      code: `const a = { ${key}: event.color }`,
      errors: rawEventColor,
    })),
    {
      code: `const a = resolveEventAppearance({ color: event.color, scheme: "light", increasedContrast: false })`,
      errors: eventAppearanceCall,
    },
    {
      code: `const a = theme.resolveEventAppearance({ color })`,
      errors: eventAppearanceCall,
    },
    {
      code: `const a = theme?.resolveEventAppearance({ color })`,
      errors: eventAppearanceCall,
    },
  ],
})
