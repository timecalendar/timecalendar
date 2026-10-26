// Rule rationale: docs/mobile/architecture-book/lint-format.md (Buttons) and ADR 067.
//
// A text button is the shared `Button` from `@/design`, which owns
// fill, label tone, touch target, press feedback and busy/disabled semantics. The
// rule reports a React Native `Pressable` that declares a `button` or `link` role
// and renders a text component as a direct child. Text wrapped in a layout view
// and function children are not inspected: rows and tiles legitimately use
// `Pressable`, and the rule targets text buttons only.

const DEFAULT_TEXT_COMPONENTS = ["ThemedText", "Text"]
const BUTTON_ROLES = new Set(["button", "link"])

function attributeValue(attribute) {
  const value = attribute.value
  if (!value) return undefined
  if (value.type === "Literal") return value.value
  if (
    value.type === "JSXExpressionContainer" &&
    value.expression.type === "Literal"
  ) {
    return value.expression.value
  }
  return undefined
}

function hasButtonRole(opening) {
  return opening.attributes.some(
    (attribute) =>
      attribute.type === "JSXAttribute" &&
      (attribute.name.name === "accessibilityRole" ||
        attribute.name.name === "role") &&
      BUTTON_ROLES.has(attributeValue(attribute)),
  )
}

function elementName(element) {
  const name = element.openingElement.name
  return name.type === "JSXIdentifier" ? name.name : undefined
}

function childElements(child) {
  if (child.type === "JSXElement") return [child]
  if (child.type === "JSXFragment") return child.children.flatMap(childElements)
  if (child.type !== "JSXExpressionContainer") return []
  return expressionElements(child.expression)
}

function expressionElements(expression) {
  if (expression.type === "JSXElement") return [expression]
  if (expression.type === "LogicalExpression") {
    return expressionElements(expression.right)
  }
  if (expression.type === "ConditionalExpression") {
    return [
      ...expressionElements(expression.consequent),
      ...expressionElements(expression.alternate),
    ]
  }
  return []
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow text buttons built from a raw React Native Pressable; use Button.",
    },
    schema: [
      {
        type: "object",
        properties: {
          textComponents: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      rawButton:
        "Text buttons use Button from @/design (ADR 067, lint-format.md → Buttons).",
    },
  },

  create(context) {
    const textComponents = new Set(
      context.options[0]?.textComponents ?? DEFAULT_TEXT_COMPONENTS,
    )
    const pressableNames = new Set()

    return {
      ImportDeclaration(node) {
        if (node.source.value !== "react-native") return
        for (const specifier of node.specifiers) {
          if (
            specifier.type === "ImportSpecifier" &&
            specifier.imported.name === "Pressable"
          ) {
            pressableNames.add(specifier.local.name)
          }
        }
      },
      JSXElement(node) {
        const name = elementName(node)
        if (name === undefined || !pressableNames.has(name)) return
        if (!hasButtonRole(node.openingElement)) return
        const hasTextChild = node.children
          .flatMap(childElements)
          .some((child) => textComponents.has(elementName(child)))
        if (hasTextChild) {
          context.report({ node: node.openingElement, messageId: "rawButton" })
        }
      },
    }
  },
}
