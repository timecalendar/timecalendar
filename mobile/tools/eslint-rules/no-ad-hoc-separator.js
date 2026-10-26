// Rule rationale: docs/mobile/architecture-book/lint-format.md (Lists) and ADR 073.
//
// A list separator is `Separator` or `ListRowSeparator` from `@/design`, which own
// the platform thickness, the separator color, the inset to the row's text start
// and the hidden-from-assistive-technology semantics. The rule reports a style
// property `borderBottomWidth`, `borderTopWidth` or `height` whose value is
// `StyleSheet.hairlineWidth`, the shape every hand-drawn row separator took.
// `borderWidth` (rings around logos, icons and boxes) is not a separator and
// passes. A value read through a variable is not followed.

const SEPARATOR_KEYS = new Set([
  "borderBottomWidth",
  "borderTopWidth",
  "height",
])

function keyName(key) {
  if (key.type === "Identifier") return key.name
  if (key.type === "Literal" && typeof key.value === "string") return key.value
  return undefined
}

function isHairline(value) {
  return (
    value.type === "MemberExpression" &&
    !value.computed &&
    value.object.type === "Identifier" &&
    value.object.name === "StyleSheet" &&
    value.property.type === "Identifier" &&
    value.property.name === "hairlineWidth"
  )
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hand-drawn hairline list separators; use Separator or ListRowSeparator.",
    },
    schema: [],
    messages: {
      adHocSeparator:
        "List separators are Separator / ListRowSeparator from @/design (ADR 073, lint-format.md → Lists).",
    },
  },

  create(context) {
    return {
      Property(node) {
        if (node.computed) return
        if (!SEPARATOR_KEYS.has(keyName(node.key))) return
        if (!isHairline(node.value)) return
        context.report({ node, messageId: "adHocSeparator" })
      },
    }
  },
}
