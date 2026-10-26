const { RuleTester } = require("eslint")
const tsParser = require("@typescript-eslint/parser")

const rule = require("./no-retired-list-names")

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
    ecmaVersion: 2022,
    sourceType: "module",
  },
})

const identifier = [{ messageId: "retiredIdentifier" }]
const string = [{ messageId: "retiredString" }]
const file = [{ messageId: "retiredFile" }]

ruleTester.run("no-retired-list-names", rule, {
  valid: [
    { code: `import { NativeListRow } from "@/components/chrome"` },
    { code: `const node = <NativeList />` },
    {
      code: `import { EnvironmentSettingsRow } from "@/features/environment/ui"`,
    },
    { code: `export function SettingsScreen() {}` },
    { code: `function openNativeSettings() {}` },
    { code: `useAssertOutsideNativeList("NativeTextEntryDialog")` },
    { code: `const story = "native-list--switches"` },
    { code: `t("gallery.nativeList.title")` },
    {
      code: `export {}`,
      filename: "src/features/environment/ui/environment-settings-row.tsx",
    },
  ],
  invalid: [
    {
      code: `import { NativeSettingsRow } from "@/components/chrome"`,
      errors: identifier,
    },
    { code: `type P = NativeSettingsRowProps`, errors: identifier },
    { code: `const node = <NativeSettingsHost />`, errors: identifier },
    { code: `function SettingsRow() {}`, errors: identifier },
    { code: `const SettingsSection = 1`, errors: identifier },
    { code: `function ComposeSettingsHost() {}`, errors: identifier },
    {
      code: `import x from "@/components/chrome/native-settings"`,
      errors: string,
    },
    { code: `jest.mock("./native-settings-icons")`, errors: string },
    { code: "const id = `gallery-native-settings-${v}`", errors: string },
    { code: `t("gallery.nativeSettings.title")`, errors: string },
    {
      code: `export {}`,
      filename: "src/components/chrome/native-settings.tsx",
      errors: file,
    },
    {
      code: `export {}`,
      filename: "src/features/settings/ui/settings-row.tsx",
      errors: file,
    },
  ],
})
