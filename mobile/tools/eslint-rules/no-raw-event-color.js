// Rule rationale: docs/mobile/architecture-book/lint-format.md (Event colors),
// ADR 074 and ADR 076.
//
// An event or calendar color enters the UI through `ColorDot` or `EventSurface`
// from `@/design`, which own the dot's shape and semantics and the tile's tint,
// accent stripe and foreground text. The rule reports a fill or border color
// style property (`backgroundColor`, `borderColor` and each per-side border
// color) whose value is a non-computed `.color` member (`event.color`,
// `tag.color`, `item?.color`), the shape every hand-drawn dot, swatch, tag pill
// and tile stripe took. `theme.color` is a token read and passes. It also
// reports a call to `resolveEventAppearance`: a feature tile that resolves its
// own appearance is a second tile implementation. A value read through a
// variable or another helper, and a `color=` JSX prop, are not followed.

const FILL_KEYS = new Set([
  "backgroundColor",
  "borderColor",
  "borderLeftColor",
  "borderRightColor",
  "borderTopColor",
  "borderBottomColor",
  "borderStartColor",
  "borderEndColor",
])

const RESOLVER = "resolveEventAppearance"

function keyName(key) {
  if (key.type === "Identifier") return key.name
  if (key.type === "Literal" && typeof key.value === "string") return key.value
  return undefined
}

function isResolverCall(callee) {
  const target = callee.type === "ChainExpression" ? callee.expression : callee
  if (target.type === "Identifier") return target.name === RESOLVER
  return (
    target.type === "MemberExpression" &&
    !target.computed &&
    target.property.type === "Identifier" &&
    target.property.name === RESOLVER
  )
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
        "Disallow raw event-color style fills and event appearance resolution outside the design layer; use ColorDot or EventSurface.",
    },
    schema: [],
    messages: {
      rawEventColor:
        "Event colors are ColorDot (or EventSurface) from @/design (ADR 074, lint-format.md → Event colors).",
      eventAppearanceCall:
        "Event tiles are EventSurface from @/design (ADR 076, lint-format.md → Event colors).",
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
      CallExpression(node) {
        if (!isResolverCall(node.callee)) return
        context.report({ node, messageId: "eventAppearanceCall" })
      },
    }
  },
}
