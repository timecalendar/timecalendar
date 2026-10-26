// Rule rationale: docs/mobile/architecture-book/lint-format.md (Style literals)
// and ADR 077.
//
// Visual style values come from the token layer (`src/theme/`) and the type
// ramp: colors from `useTheme()`, type from `ThemedText type=` / `TypeRamp`,
// elevation from `Elevation.raised`, spacing from `Spacing`, corner radii from
// `Radii` / `ListGeometry`. The rule matches style keys anywhere (inline
// styles, `StyleSheet.create`, style arrays, `.ts` helpers), not style
// positions, and reports a literal value per category:
// - colors: a hex, rgb()/hsl() or CSS named color in `color`, `tintColor` or a
//   `*Color` key or JSX prop (`transparent` passes; `themeColor` is a typed
//   token name and is skipped);
// - typography: a literal `fontSize`, `lineHeight` or `fontWeight`;
// - shadows: any legacy `shadow*` / `elevation` key, and a literal `boxShadow`;
// - spacing / radius: a number other than 0 or 1 in a padding, margin, gap or
//   corner radius key.
// Casts, conditional and logical branches, signs, literal-only arithmetic,
// template literals and `Platform.select` objects are seen through. A literal
// read through a variable, an imported constant or a spread, a computed key,
// and SwiftUI/Compose modifier arguments are not followed.

const NAMED_COLORS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black " +
    "blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse " +
    "chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan " +
    "darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta " +
    "darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet " +
    "deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite " +
    "forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green " +
    "greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender " +
    "lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon " +
    "lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue " +
    "lightyellow lime limegreen linen magenta maroon mediumaquamarine " +
    "mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue " +
    "mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream " +
    "mistyrose moccasin navajowhite navy oldlace olive olivedrab orange " +
    "orangered orchid palegoldenrod palegreen paleturquoise palevioletred " +
    "papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red " +
    "rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell " +
    "sienna silver skyblue slateblue slategray slategrey snow springgreen " +
    "steelblue tan teal thistle tomato turquoise violet wheat white " +
    "whitesmoke yellow yellowgreen"
  ).split(" "),
)

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const FUNCTIONAL = /^(rgba?|hsla?)\(/i

const TYPOGRAPHY_KEYS = new Set(["fontSize", "lineHeight", "fontWeight"])
const SHADOW_KEYS = new Set([
  "shadowColor",
  "shadowOffset",
  "shadowOpacity",
  "shadowRadius",
  "elevation",
])
const SPACING_KEY =
  /^(padding|margin)(Top|Bottom|Left|Right|Start|End|Horizontal|Vertical|Block|BlockStart|BlockEnd|Inline|InlineStart|InlineEnd)?$|^(gap|rowGap|columnGap)$/
const RADIUS_KEY =
  /^border(TopLeft|TopRight|BottomLeft|BottomRight|TopStart|TopEnd|BottomStart|BottomEnd|StartStart|StartEnd|EndStart|EndEnd)?Radius$/

const CAST_TYPES = new Set([
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
  "TSTypeAssertion",
])

const DEFAULTS = {
  colors: true,
  typography: false,
  shadows: true,
  spacing: false,
  radius: false,
}

function keyName(key) {
  if (key.type === "Identifier") return key.name
  if (key.type === "Literal" && typeof key.value === "string") return key.value
  return undefined
}

function isColorKey(name) {
  return name !== "themeColor" && (name === "color" || name.endsWith("Color"))
}

function classify(name) {
  if (SHADOW_KEYS.has(name)) return "shadowKey"
  if (name === "boxShadow") return "boxShadow"
  if (isColorKey(name)) return "colors"
  if (TYPOGRAPHY_KEYS.has(name)) return "typography"
  if (SPACING_KEY.test(name)) return "spacing"
  if (RADIUS_KEY.test(name)) return "radius"
  return undefined
}

function evaluateNumber(node) {
  if (node.type === "Literal") {
    return typeof node.value === "number" ? node.value : undefined
  }
  if (node.type === "UnaryExpression" && "-+".includes(node.operator)) {
    const value = evaluateNumber(node.argument)
    if (value === undefined) return undefined
    return node.operator === "-" ? -value : value
  }
  if (node.type === "BinaryExpression") {
    const left = evaluateNumber(node.left)
    const right = evaluateNumber(node.right)
    if (left === undefined || right === undefined) return undefined
    switch (node.operator) {
      case "+":
        return left + right
      case "-":
        return left - right
      case "*":
        return left * right
      case "/":
        return left / right
      default:
        return undefined
    }
  }
  return undefined
}

function isPlatformSelect(node) {
  const { callee } = node
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.object.type === "Identifier" &&
    callee.object.name === "Platform" &&
    callee.property.type === "Identifier" &&
    callee.property.name === "select" &&
    node.arguments[0]?.type === "ObjectExpression"
  )
}

// The literal leaves a value can evaluate to: `{ node, value }` for a string or
// number, `{ node, template }` (the first quasi) for a template literal.
function literalLeaves(node) {
  if (CAST_TYPES.has(node.type)) return literalLeaves(node.expression)
  if (node.type === "ConditionalExpression") {
    return [...literalLeaves(node.consequent), ...literalLeaves(node.alternate)]
  }
  if (node.type === "LogicalExpression") {
    return [...literalLeaves(node.left), ...literalLeaves(node.right)]
  }
  if (node.type === "TemplateLiteral") {
    return [{ node, template: node.quasis[0].value.cooked ?? "" }]
  }
  if (node.type === "CallExpression" && isPlatformSelect(node)) {
    return node.arguments[0].properties
      .filter((property) => property.type === "Property")
      .flatMap((property) => literalLeaves(property.value))
  }
  if (node.type === "Literal" && typeof node.value === "string") {
    return [{ node, value: node.value }]
  }
  const number = evaluateNumber(node)
  return number === undefined ? [] : [{ node, value: number }]
}

function isColorLeaf(leaf) {
  if (leaf.template !== undefined) {
    return leaf.template.startsWith("#") || FUNCTIONAL.test(leaf.template)
  }
  if (typeof leaf.value !== "string") return false
  return (
    HEX.test(leaf.value) ||
    FUNCTIONAL.test(leaf.value) ||
    NAMED_COLORS.has(leaf.value.toLowerCase())
  )
}

function isOffScaleNumber(leaf) {
  return typeof leaf.value === "number" && leaf.value !== 0 && leaf.value !== 1
}

function isAnyLiteral(leaf) {
  return leaf.template !== undefined || leaf.value !== undefined
}

const VALUE_CHECKS = {
  colors: { option: "colors", messageId: "colorLiteral", test: isColorLeaf },
  typography: {
    option: "typography",
    messageId: "typographyLiteral",
    test: isAnyLiteral,
  },
  boxShadow: {
    option: "shadows",
    messageId: "legacyShadow",
    test: isAnyLiteral,
  },
  spacing: {
    option: "spacing",
    messageId: "spacingLiteral",
    test: isOffScaleNumber,
  },
  radius: {
    option: "radius",
    messageId: "radiusLiteral",
    test: isOffScaleNumber,
  },
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow color, typography, legacy shadow, spacing and radius literals in styles; use the theme tokens and the type ramp.",
    },
    schema: [
      {
        type: "object",
        properties: {
          colors: { type: "boolean" },
          typography: { type: "boolean" },
          shadows: { type: "boolean" },
          spacing: { type: "boolean" },
          radius: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      colorLiteral:
        "Colors come from useTheme() (lint-format.md → Style literals, ADR 077).",
      typographyLiteral:
        "Type comes from ThemedText type= or TypeRamp (lint-format.md → Style literals, ADR 077).",
      legacyShadow:
        "Elevation is Elevation.raised as boxShadow, not shadow*/elevation keys or a literal (lint-format.md → Style literals, ADR 077).",
      spacingLiteral:
        "Spacing comes from Spacing (lint-format.md → Style literals, ADR 077).",
      radiusLiteral:
        "Corner radii come from Radii or ListGeometry (lint-format.md → Style literals, ADR 077).",
    },
  },

  create(context) {
    const options = { ...DEFAULTS, ...context.options[0] }

    function checkValue(category, value) {
      const check = VALUE_CHECKS[category]
      if (!options[check.option]) return
      for (const leaf of literalLeaves(value)) {
        if (check.test(leaf)) {
          context.report({ node: leaf.node, messageId: check.messageId })
        }
      }
    }

    return {
      Property(node) {
        if (node.computed) return
        const name = keyName(node.key)
        if (name === undefined) return
        const category = classify(name)
        if (category === undefined) return
        if (category === "shadowKey") {
          if (options.shadows) {
            context.report({ node, messageId: "legacyShadow" })
          }
          return
        }
        checkValue(category, node.value)
      },
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier") return
        if (!isColorKey(node.name.name) || node.value === null) return
        if (node.value.type !== "JSXExpressionContainer") {
          checkValue("colors", node.value)
          return
        }
        const { expression } = node.value
        if (expression.type === "JSXEmptyExpression") return
        if (expression.type === "ObjectExpression") {
          for (const property of expression.properties) {
            if (property.type === "Property") {
              checkValue("colors", property.value)
            }
          }
          return
        }
        checkValue("colors", expression)
      },
    }
  },
}
