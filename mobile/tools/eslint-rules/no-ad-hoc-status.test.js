const { RuleTester } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const rule = require("./no-ad-hoc-status")

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
    ecmaVersion: 2022,
    sourceType: "module",
  },
})

const spinner = [{ messageId: "activityIndicator" }]
const empty = [{ messageId: "listEmpty" }]

ruleTester.run("no-ad-hoc-status", rule, {
  valid: [
    { code: `const a = <FlatList ListEmptyComponent={<StatusView />} />` },
    {
      code: `const a = <FlatList ListEmptyComponent={loading ? <StatusView kind="loading" /> : <StatusView kind="empty" />} />`,
    },
    {
      code: `const a = <FlatList ListEmptyComponent={loading ? <StatusView /> : null} />`,
    },
    {
      code: `const a = <FlatList ListEmptyComponent={ready && <StatusView />} />`,
    },
    {
      code: `const a = <FlatList ListEmptyComponent={<><StatusView /></>} />`,
    },
    { code: `const a = <FlatList ListEmptyComponent={undefined} />` },
    {
      code: `import { ActivityIndicator } from "react-native-paper"\nconst a = <ActivityIndicator />`,
    },
    { code: `import { View } from "react-native"` },
  ],
  invalid: [
    {
      code: `import { ActivityIndicator } from "react-native"`,
      errors: spinner,
    },
    {
      code: `import { ActivityIndicator as Spinner, View } from "react-native"`,
      errors: spinner,
    },
    {
      code: `const a = <FlatList ListEmptyComponent={<View />} />`,
      errors: empty,
    },
    {
      code: `const a = <FlatList ListEmptyComponent={cond ? <StatusView /> : <ThemedText>None</ThemedText>} />`,
      errors: empty,
    },
    {
      code: `const a = <FlatList ListEmptyComponent={EmptyThing} />`,
      errors: empty,
    },
    {
      code: `const a = <FlatList ListEmptyComponent={<><StatusView /><Text>x</Text></>} />`,
      errors: empty,
    },
    {
      code: `const a = <FlatList ListEmptyComponent={renderEmpty()} />`,
      errors: empty,
    },
  ],
})
