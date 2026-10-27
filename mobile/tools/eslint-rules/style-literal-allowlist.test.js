const { describeCategoryAllowlist } = require("./category-allowlist-suite")
const {
  styleLiteralAllowlist,
  styleLiteralCategoryOption,
} = require("./style-literal-allowlist")

// Raising this needs a reason in review: the allowlist only shrinks.
const STYLE_LITERAL_ALLOWLIST_CEILING = {
  colorLiteral: 1,
  typographyLiteral: 5,
  legacyShadow: 0,
  spacingLiteral: 5,
  radiusLiteral: 3,
}

describeCategoryAllowlist({
  name: "style-literal allowlist",
  ruleId: "local/no-style-literals",
  ruleOptions: {
    colors: true,
    typography: true,
    shadows: true,
    spacing: true,
    radius: true,
  },
  allowlist: styleLiteralAllowlist,
  categoryOption: styleLiteralCategoryOption,
  ceiling: STYLE_LITERAL_ALLOWLIST_CEILING,
})
