// Rule rationale: docs/mobile/architecture-book/lint-format.md (Radio groups)
// and ADR 078.
//
// A single choice among options is `ColorSwatchField` from `@/design` or a
// `NativeList` choice row from `@/components/chrome`, which own the platform
// roles, touch targets and press feedback. A hand-built choice control has no
// reliable static shape, but its role does: the rule reports a JSX
// `accessibilityRole` or `role` whose value is the literal "radiogroup" or
// "radio", directly or as either branch of a conditional.

const RADIO_ROLES = new Set(["radiogroup", "radio"])
const ROLE_ATTRIBUTES = new Set(["accessibilityRole", "role"])

function namesRadio(node) {
  if (node == null) return false
  if (node.type === "Literal") return RADIO_ROLES.has(node.value)
  if (node.type === "TemplateLiteral") {
    return (
      node.expressions.length === 0 &&
      RADIO_ROLES.has(node.quasis[0].value.cooked)
    )
  }
  if (node.type === "ConditionalExpression") {
    return namesRadio(node.consequent) || namesRadio(node.alternate)
  }
  if (node.type === "JSXExpressionContainer") return namesRadio(node.expression)
  return false
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hand-built radio groups; use ColorSwatchField or a NativeList choice row.",
    },
    schema: [],
    messages: {
      rawRadioGroup:
        "A single choice among options is ColorSwatchField from @/design or a NativeList choice row from @/components/chrome.",
    },
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier") return
        if (!ROLE_ATTRIBUTES.has(node.name.name)) return
        if (namesRadio(node.value)) {
          context.report({ node, messageId: "rawRadioGroup" })
        }
      },
    }
  },
}
