// Rule rationale: docs/mobile/architecture-book/lint-format.md (Status) and ADR 069.
//
// Loading, empty and error states are the shared `StatusView` from `@/design`,
// which owns layout, scrolling, spinner color, roles and announcements. The rule
// reports a named `ActivityIndicator` import from React Native, and a list's
// `ListEmptyComponent` that renders anything but `StatusView`, looking through
// conditional and logical expressions and fragments. `null` and `undefined`
// branches pass. A plain-text empty outside a list slot is invisible to it.

const STATUS_COMPONENT = "StatusView"

function isNullish(expression) {
  return (
    (expression.type === "Literal" && expression.value === null) ||
    (expression.type === "Identifier" && expression.name === "undefined")
  )
}

function elementName(element) {
  const name = element.openingElement.name
  return name.type === "JSXIdentifier" ? name.name : undefined
}

function offenders(node) {
  switch (node.type) {
    case "JSXElement":
      return elementName(node) === STATUS_COMPONENT ? [] : [node]
    case "JSXFragment":
      return node.children.flatMap((child) =>
        child.type === "JSXText" && child.value.trim() === ""
          ? []
          : offenders(child),
      )
    case "JSXExpressionContainer":
      return node.expression.type === "JSXEmptyExpression"
        ? []
        : offenders(node.expression)
    case "ConditionalExpression":
      return [...offenders(node.consequent), ...offenders(node.alternate)]
    case "LogicalExpression":
      return offenders(node.right)
    case "Identifier":
      return isNullish(node) || node.name === STATUS_COMPONENT ? [] : [node]
    default:
      return isNullish(node) ? [] : [node]
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hand-built loading and list-empty states; use StatusView.",
    },
    schema: [],
    messages: {
      activityIndicator:
        "Loading states use StatusView from @/design (ADR 069, lint-format.md → Status).",
      listEmpty:
        "ListEmptyComponent renders StatusView from @/design with the section presentation (ADR 069, lint-format.md → Status).",
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value !== "react-native") return
        for (const specifier of node.specifiers) {
          if (
            specifier.type === "ImportSpecifier" &&
            specifier.imported.name === "ActivityIndicator"
          ) {
            context.report({ node: specifier, messageId: "activityIndicator" })
          }
        }
      },
      JSXAttribute(node) {
        if (node.name.name !== "ListEmptyComponent" || !node.value) return
        if (offenders(node.value).length > 0) {
          context.report({ node, messageId: "listEmpty" })
        }
      },
    }
  },
}
