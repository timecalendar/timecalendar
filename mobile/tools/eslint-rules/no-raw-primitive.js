// Rule rationale: docs/mobile/architecture-book/lint-format.md (Raw primitives) and ADR 077.
//
// Feature screens render text through `ThemedText` and present sheets through a
// Router route or the native menu. The rule reports a value import or re-export
// of `Text` or `Modal` from React Native, aliases included; a type-only import
// passes. `TextInput`, `ActivityIndicator`, `Button` and the touchables have
// their own gates (no-raw-text-input, no-ad-hoc-status, no-restricted-imports),
// so this rule leaves them alone and nothing is reported twice. Each primitive
// is an option so the per-file allowlist turns off only what a file still uses.
// A namespace import or `require` is not seen (same static-import caveat as the
// sibling rules).

const primitives = {
  Text: { option: "text", messageId: "rawText" },
  Modal: { option: "modal", messageId: "rawModal" },
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw React Native Text and Modal in feature screens.",
    },
    schema: [
      {
        type: "object",
        properties: {
          text: { type: "boolean" },
          modal: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      rawText:
        "Render text with ThemedText from @/design (ADR 077, lint-format.md → Raw primitives).",
      rawModal:
        "Present a Router route with a sheet or modal presentation, or MenuView from @/components/chrome (ADR 077, lint-format.md → Raw primitives).",
    },
  },

  create(context) {
    const options = { text: true, modal: true, ...context.options[0] }

    const check = (node, name) => {
      const primitive = primitives[name]
      if (primitive && options[primitive.option]) {
        context.report({ node, messageId: primitive.messageId })
      }
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value !== "react-native") return
        if (node.importKind === "type") return
        for (const specifier of node.specifiers) {
          if (
            specifier.type === "ImportSpecifier" &&
            specifier.importKind !== "type"
          ) {
            check(specifier, specifier.imported.name)
          }
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source?.value !== "react-native") return
        if (node.exportKind === "type") return
        for (const specifier of node.specifiers) {
          if (specifier.exportKind !== "type")
            check(specifier, specifier.local.name)
        }
      },
    }
  },
}
