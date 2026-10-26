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

ruleTester.run("no-raw-event-color", rule, {
  valid: [
    { code: `const a = { backgroundColor: theme.primary }` },
    { code: `const a = { backgroundColor: theme.color }` },
    { code: `const a = { backgroundColor: hex }` },
    {
      code: `const a = { backgroundColor: eventSurfaceColor(event.color, scheme) }`,
    },
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
  ],
})
