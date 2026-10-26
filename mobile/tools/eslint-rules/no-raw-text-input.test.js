const { RuleTester } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const rule = require("./no-raw-text-input")

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
    ecmaVersion: 2022,
    sourceType: "module",
  },
})

const raw = [{ messageId: "rawTextInput" }]

ruleTester.run("no-raw-text-input", rule, {
  valid: [
    { code: `import type { TextInput } from "react-native"` },
    { code: `import { type TextInput, View } from "react-native"` },
    { code: `import { TextInput } from "react-native-paper"` },
    { code: `import { TextField } from "@/design"` },
    { code: `import { View } from "react-native"` },
  ],
  invalid: [
    { code: `import { TextInput } from "react-native"`, errors: raw },
    { code: `import { TextInput as Input } from "react-native"`, errors: raw },
    { code: `import { View, TextInput } from "react-native"`, errors: raw },
  ],
})
