// Rule rationale: docs/mobile/architecture-book/lint-format.md (Header actions)
// and ADR 075.
//
// Navigation-bar actions are declared through `useHeaderActions` from
// `@/components/chrome`, which renders native bar button items on iOS and
// Material 3 actions on Android with the label tint, the platform targets and a
// required accessible name. The rule reports the navigation options a screen
// would otherwise set by hand (`headerRight`, `headerLeft`,
// `unstable_headerRightItems`, `unstable_headerLeftItems`) and a `Stack.Toolbar`
// placed in the navigation bar. A `Stack.Toolbar` with no placement or the
// literal `placement="bottom"` is the iOS bottom toolbar and passes. Options
// built through a computed key or spread from another module are not seen.

const HEADER_ACTION_KEYS = new Set([
  "headerRight",
  "headerLeft",
  "unstable_headerRightItems",
  "unstable_headerLeftItems",
])

function keyName(key) {
  if (key.type === "Identifier") return key.name
  if (key.type === "Literal" && typeof key.value === "string") return key.value
  return undefined
}

function isStackToolbar(name) {
  return (
    name.type === "JSXMemberExpression" &&
    name.object.type === "JSXIdentifier" &&
    name.object.name === "Stack" &&
    name.property.name === "Toolbar"
  )
}

function isBottomPlacement(attribute) {
  const { value } = attribute
  if (value === null) return false
  if (value.type === "Literal") return value.value === "bottom"
  return (
    value.type === "JSXExpressionContainer" &&
    value.expression.type === "Literal" &&
    value.expression.value === "bottom"
  )
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hand-built navigation-bar actions; use useHeaderActions from @/components/chrome.",
    },
    schema: [],
    messages: {
      adHocHeaderAction:
        "Header actions are declared through useHeaderActions from @/components/chrome (ADR 075, lint-format.md → Header actions).",
    },
  },

  create(context) {
    return {
      Property(node) {
        if (node.computed) return
        if (!HEADER_ACTION_KEYS.has(keyName(node.key))) return
        context.report({ node, messageId: "adHocHeaderAction" })
      },
      JSXOpeningElement(node) {
        if (!isStackToolbar(node.name)) return
        const placement = node.attributes.find(
          (attribute) =>
            attribute.type === "JSXAttribute" &&
            attribute.name.name === "placement",
        )
        if (placement === undefined || isBottomPlacement(placement)) return
        context.report({ node, messageId: "adHocHeaderAction" })
      },
    }
  },
}
