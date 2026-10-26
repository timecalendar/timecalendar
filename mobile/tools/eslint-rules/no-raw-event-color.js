// Rule rationale: docs/mobile/architecture-book/lint-format.md (Event colors) and ADR 074.
//
// An event or calendar color enters the UI through `ColorDot` (and the event
// surface) from `@/design`, which own its shape, size, ring and the
// hidden-from-assistive-technology semantics. The rule reports a style property
// `backgroundColor` or `borderColor` whose value is a non-computed `.color`
// member (`event.color`, `tag.color`, `item?.color`), the shape every
// hand-drawn dot, swatch and tag pill took. `theme.color` is a token read and
// passes. A value read through a variable or a call, and a `color=` JSX prop,
// are not followed.

const FILL_KEYS = new Set(["backgroundColor", "borderColor"])

function keyName(key) {
  if (key.type === "Identifier") return key.name
  if (key.type === "Literal" && typeof key.value === "string") return key.value
  return undefined
}

function isDataColor(value) {
  const member = value.type === "ChainExpression" ? value.expression : value
  return (
    member.type === "MemberExpression" &&
    !member.computed &&
    member.property.type === "Identifier" &&
    member.property.name === "color" &&
    !(member.object.type === "Identifier" && member.object.name === "theme")
  )
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw event-color style fills outside the design layer; use ColorDot.",
    },
    schema: [],
    messages: {
      rawEventColor:
        "Event colors are ColorDot (or EventSurface) from @/design (ADR 074, lint-format.md → Event colors).",
    },
  },

  create(context) {
    return {
      Property(node) {
        if (node.computed) return
        if (!FILL_KEYS.has(keyName(node.key))) return
        if (!isDataColor(node.value)) return
        context.report({ node, messageId: "rawEventColor" })
      },
    }
  },
}
