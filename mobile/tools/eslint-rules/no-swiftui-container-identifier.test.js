const { RuleTester } = require("eslint")

const rule = require("./no-swiftui-container-identifier")

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

const imports = `
  import {
    BottomSheet, Button, Form, Group, Host, LabeledContent, ProgressView,
    Section, Text, TextField, Toggle,
  } from "@expo/ui/swift-ui"
  import { accessibilityIdentifier, font } from "@expo/ui/swift-ui/modifiers"
`

const containerIdentifier = (name) => ({
  messageId: "containerIdentifier",
  data: { name },
})

ruleTester.run("no-swiftui-container-identifier", rule, {
  valid: [
    {
      code: `${imports}
        const leaves = (
          <Host testID="host">
            <Button label="b" modifiers={[accessibilityIdentifier("b")]} />
            <Text modifiers={[font({ textStyle: "headline" }), accessibilityIdentifier("t")]}>t</Text>
            <TextField testID="f" modifiers={[accessibilityIdentifier("f")]} />
            <Toggle testID="s" modifiers={[accessibilityIdentifier("s")]} />
            <LabeledContent testID="r" modifiers={[accessibilityIdentifier("r")]} />
            <ProgressView testID="p" />
          </Host>
        )
      `,
    },
    {
      code: `
        import { View as Section } from "react-native"
        const row = <Section testID="x" />
      `,
    },
    {
      code: `
        function Section(props) { return props.children }
        const row = <Section testID="x" />
      `,
    },
    {
      code: `${imports}
        const form = <Form modifiers={[font({ textStyle: "body" })]}><Section /></Form>
      `,
    },
  ],
  invalid: [
    {
      code: `${imports}
        const s = <Section modifiers={[accessibilityIdentifier("s")]} />
      `,
      errors: [containerIdentifier("Section")],
    },
    {
      code: `
        import { Section as SwiftSection } from "@expo/ui/swift-ui"
        import { accessibilityIdentifier } from "@expo/ui/swift-ui/modifiers"
        const s = <SwiftSection modifiers={[accessibilityIdentifier("s")]} />
      `,
      errors: [containerIdentifier("Section")],
    },
    {
      code: `
        import * as SwiftUI from "@expo/ui/swift-ui"
        const s = <SwiftUI.VStack testID="x" />
      `,
      errors: [containerIdentifier("VStack")],
    },
    {
      code: `
        import { Group } from "@expo/ui/swift-ui"
        import { accessibilityIdentifier as id } from "@expo/ui/swift-ui/modifiers"
        const g = <Group modifiers={[...(c ? [id("g")] : [])]} />
      `,
      errors: [containerIdentifier("Group")],
    },
    {
      code: `
        import { Form } from "@expo/ui/swift-ui"
        import * as m from "@expo/ui/swift-ui/modifiers"
        const mods = [m.accessibilityIdentifier("x")]
        const f = <Form modifiers={mods} />
      `,
      errors: [containerIdentifier("Form")],
    },
    {
      code: `${imports}
        const h = <Host modifiers={[accessibilityIdentifier("h")]} />
      `,
      errors: [containerIdentifier("Host")],
    },
    {
      code: `${imports}
        const b = <BottomSheet testID="sheet" isPresented />
      `,
      errors: [containerIdentifier("BottomSheet")],
    },
  ],
})
