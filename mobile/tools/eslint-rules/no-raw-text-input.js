// Rule rationale: docs/mobile/architecture-book/lint-format.md (Fields) and ADR 070.
//
// A text field is the shared `TextField` from `@/design`, which owns the visible
// label, the platform box, font scaling and the error wiring. The rule reports a
// value import of `TextInput` from React Native, aliases included. A type-only
// import (`import type { TextInput }` or `import { type TextInput }`) passes: a
// ref type never renders an input.

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow raw React Native text inputs; use TextField.",
    },
    schema: [],
    messages: {
      rawTextInput:
        "Text fields use TextField from @/design (ADR 070, lint-format.md → Fields).",
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value !== "react-native") return
        if (node.importKind === "type") return
        for (const specifier of node.specifiers) {
          if (
            specifier.type === "ImportSpecifier" &&
            specifier.importKind !== "type" &&
            specifier.imported.name === "TextInput"
          ) {
            context.report({ node: specifier, messageId: "rawTextInput" })
          }
        }
      },
    }
  },
}
