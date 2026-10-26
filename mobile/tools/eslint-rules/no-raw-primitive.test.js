const { RuleTester } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const rule = require("./no-raw-primitive")

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
    ecmaVersion: 2022,
    sourceType: "module",
  },
})

const rawText = { messageId: "rawText" }
const rawModal = { messageId: "rawModal" }

ruleTester.run("no-raw-primitive", rule, {
  valid: [
    { code: `import { View } from "react-native"` },
    { code: `import RN from "react-native"` },
    { code: `import type { Text } from "react-native"` },
    { code: `import { type Modal, View } from "react-native"` },
    { code: `import { Text } from "react-native-paper"` },
    { code: `import { ThemedText as Title } from "@/design"` },
    { code: `export type { Text } from "react-native"` },
    { code: `export { type Modal } from "react-native"` },
    { code: `export { View } from "react-native"` },
    { code: `export { Text } from "@/design"` },
    { code: `const Row = 1; export { Row }` },
    { code: `import { Text } from "react-native"`, options: [{ text: false }] },
    {
      code: `import { Modal } from "react-native"`,
      options: [{ modal: false }],
    },
  ],
  invalid: [
    { code: `import { Text } from "react-native"`, errors: [rawText] },
    { code: `import { Text as Title } from "react-native"`, errors: [rawText] },
    { code: `import { Modal } from "react-native"`, errors: [rawModal] },
    {
      code: `import { Modal as Sheet, Text, View } from "react-native"`,
      errors: [rawModal, rawText],
    },
    { code: `export { Text } from "react-native"`, errors: [rawText] },
    {
      code: `export { Modal as Sheet } from "react-native"`,
      errors: [rawModal],
    },
    {
      code: `import { Modal } from "react-native"`,
      options: [{ text: false }],
      errors: [rawModal],
    },
    {
      code: `import { Text } from "react-native"`,
      options: [{ modal: false }],
      errors: [rawText],
    },
  ],
})
