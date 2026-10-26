const { RuleTester } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const rule = require("./no-raw-button")

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
    ecmaVersion: 2022,
    sourceType: "module",
  },
})

const header = `import { Pressable, Text, View } from "react-native"\n`
const error = [{ messageId: "rawButton" }]

ruleTester.run("no-raw-button", rule, {
  valid: [
    {
      code: `${header}const a = <Pressable accessibilityRole="button"><View><Text>Row</Text></View></Pressable>`,
    },
    {
      code: `${header}const a = <Pressable accessibilityRole="button">{({ pressed }) => <Text>Go</Text>}</Pressable>`,
    },
    {
      code: `import { Pressable } from "react-native-gesture-handler"\nconst a = <Pressable accessibilityRole="button"><Text>Go</Text></Pressable>`,
    },
    {
      code: `${header}const a = <Pressable onPress={go}><Text>Go</Text></Pressable>`,
    },
    {
      code: `${header}const a = <Pressable accessibilityRole="switch"><Text>Go</Text></Pressable>`,
    },
    {
      code: `${header}const a = <Pressable accessibilityRole={role}><Text>Go</Text></Pressable>`,
    },
  ],
  invalid: [
    {
      code: `${header}import { ThemedText } from "@/design"\nconst a = <Pressable accessibilityRole="button"><ThemedText>Save</ThemedText></Pressable>`,
      errors: error,
    },
    {
      code: `${header}const a = <Pressable role="link"><Text>Open</Text></Pressable>`,
      errors: error,
    },
    {
      code: `${header}const a = <Pressable accessibilityRole={"button"}><Text>Go</Text></Pressable>`,
      errors: error,
    },
    {
      code: `import { Pressable as P, Text } from "react-native"\nconst a = <P accessibilityRole="button"><Text>Go</Text></P>`,
      errors: error,
    },
    {
      code: `${header}const a = <Pressable accessibilityRole="button">{busy && <Text>Saving</Text>}</Pressable>`,
      errors: error,
    },
    {
      code: `${header}const a = <Pressable accessibilityRole="button">{busy ? <Spinner /> : <Text>Save</Text>}</Pressable>`,
      errors: error,
    },
    {
      code: `${header}const a = <Pressable accessibilityRole="button"><Icon name="add" /><Text>Add</Text></Pressable>`,
      errors: error,
    },
    {
      code: `${header}const a = <Pressable accessibilityRole="button"><><Text>Add</Text></></Pressable>`,
      errors: error,
    },
    {
      code: `${header}const a = <Pressable accessibilityRole="button"><Label>Add</Label></Pressable>`,
      options: [{ textComponents: ["Label"] }],
      errors: error,
    },
  ],
})
