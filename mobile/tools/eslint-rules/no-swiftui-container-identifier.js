const { findVariable } = require("./scope")

// Rule rationale: docs/mobile/architecture-book/lint-format.md (L12)
//
// SwiftUI applies an accessibility identifier set on a container to every
// child and replaces the children's own identifiers, so a row inside a
// `Section` with an identifier reads as the section. Nothing but a device shows
// it: the Jest mocks render the identifier where it was written.
//
// A container is an `@expo/ui/swift-ui` view that lays out or groups children
// and is not an accessibility element. Controls and labelled rows (Button,
// Toggle, LabeledContent, Text, TextField, ProgressView, …) are elements, so
// their identifier is their own. Re-check this list against the
// `@expo/ui/swift-ui` exports on every SDK bump.
const CONTAINERS = new Set([
  "BottomSheet",
  "ControlGroup",
  "DisclosureGroup",
  "Form",
  "GlassEffectContainer",
  "Grid",
  "Group",
  "HStack",
  "LazyHStack",
  "LazyVStack",
  "List",
  "Mask",
  "Namespace",
  "Overlay",
  "ScrollView",
  "Section",
  "TabView",
  "VStack",
  "ZStack",
])

// The Host is a UIKit view: React Native applies its `testID` there, outside
// SwiftUI. Its modifiers land on the SwiftUI root and do cascade.
const HOST = "Host"

const SWIFT_UI = "@expo/ui/swift-ui"
const MODIFIERS = "@expo/ui/swift-ui/modifiers"
const IDENTIFIER_MODIFIER = "accessibilityIdentifier"

const TS_WRAPPERS = new Set([
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
  "TSTypeAssertion",
])

function importedName(specifier) {
  return specifier.imported.type === "Identifier"
    ? specifier.imported.name
    : specifier.imported.value
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow accessibility identifiers on SwiftUI container views (they cascade onto every child).",
    },
    schema: [],
    messages: {
      containerIdentifier:
        "SwiftUI {{name}} applies its accessibility identifier to every child, replacing theirs; put the identifier on a leaf (lint-format.md → L12).",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode
    const swiftUiNames = new Map()
    const swiftUiNamespaces = new Set()
    const identifierModifiers = new Set()
    const modifierNamespaces = new Set()

    function componentName(nameNode) {
      if (nameNode.type === "JSXIdentifier") {
        return swiftUiNames.get(nameNode.name) ?? null
      }
      if (
        nameNode.type === "JSXMemberExpression" &&
        nameNode.object.type === "JSXIdentifier" &&
        swiftUiNamespaces.has(nameNode.object.name)
      ) {
        return nameNode.property.name
      }
      return null
    }

    function isIdentifierCall(node) {
      const callee = node.callee
      if (callee.type === "Identifier") {
        return identifierModifiers.has(callee.name)
      }
      return (
        callee.type === "MemberExpression" &&
        callee.object.type === "Identifier" &&
        modifierNamespaces.has(callee.object.name) &&
        !callee.computed &&
        callee.property.type === "Identifier" &&
        callee.property.name === IDENTIFIER_MODIFIER
      )
    }

    function findIdentifierCall(node, visited) {
      if (!node) {
        return null
      }
      if (TS_WRAPPERS.has(node.type)) {
        return findIdentifierCall(node.expression, visited)
      }
      switch (node.type) {
        case "ArrayExpression":
          for (const element of node.elements) {
            const found = findIdentifierCall(element, visited)
            if (found) {
              return found
            }
          }
          return null
        case "SpreadElement":
          return findIdentifierCall(node.argument, visited)
        case "ConditionalExpression":
          return (
            findIdentifierCall(node.consequent, visited) ??
            findIdentifierCall(node.alternate, visited)
          )
        case "LogicalExpression":
          return (
            findIdentifierCall(node.left, visited) ??
            findIdentifierCall(node.right, visited)
          )
        case "CallExpression":
          return isIdentifierCall(node) ? node : null
        case "Identifier": {
          const variable = findVariable(sourceCode.getScope(node), node.name)
          const definition = variable?.defs[0]
          if (
            !definition ||
            visited.has(definition.node) ||
            definition.type !== "Variable" ||
            definition.parent.kind !== "const"
          ) {
            return null
          }
          visited.add(definition.node)
          return findIdentifierCall(definition.node.init, visited)
        }
        default:
          return null
      }
    }

    function report(node, name) {
      context.report({ node, messageId: "containerIdentifier", data: { name } })
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (source !== SWIFT_UI && source !== MODIFIERS) {
          return
        }
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportNamespaceSpecifier") {
            ;(source === SWIFT_UI ? swiftUiNamespaces : modifierNamespaces).add(
              specifier.local.name,
            )
          } else if (specifier.type === "ImportSpecifier") {
            if (source === SWIFT_UI) {
              swiftUiNames.set(specifier.local.name, importedName(specifier))
            } else if (importedName(specifier) === IDENTIFIER_MODIFIER) {
              identifierModifiers.add(specifier.local.name)
            }
          }
        }
      },
      JSXOpeningElement(node) {
        const name = componentName(node.name)
        if (!name || (name !== HOST && !CONTAINERS.has(name))) {
          return
        }
        for (const attribute of node.attributes) {
          if (attribute.type !== "JSXAttribute") {
            continue
          }
          const attributeName = attribute.name.name
          if (attributeName === "testID" && name !== HOST) {
            report(attribute, name)
          } else if (
            attributeName === "modifiers" &&
            attribute.value?.type === "JSXExpressionContainer"
          ) {
            const call = findIdentifierCall(
              attribute.value.expression,
              new Set(),
            )
            if (call) {
              report(call, name)
            }
          }
        }
      },
    }
  },
}
