const { describeCategoryAllowlist } = require("./category-allowlist-suite")
const {
  rawPrimitiveAllowlist,
  rawPrimitiveCategoryOption,
} = require("./raw-primitive-allowlist")

// Raising this needs a reason in review: the allowlist only shrinks.
const RAW_PRIMITIVE_ALLOWLIST_CEILING = { rawText: 1, rawModal: 0 }

describeCategoryAllowlist({
  name: "raw-primitive allowlist",
  ruleId: "local/no-raw-primitive",
  ruleOptions: { text: true, modal: true },
  allowlist: rawPrimitiveAllowlist,
  categoryOption: rawPrimitiveCategoryOption,
  ceiling: RAW_PRIMITIVE_ALLOWLIST_CEILING,
})
