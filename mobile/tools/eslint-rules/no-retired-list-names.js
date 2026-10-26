// Rule rationale: docs/mobile/architecture-book/lint-format.md (Native list
// names) and ADR 072.
//
// The native grouped list seam is `NativeList*` from `@/components/chrome`, and
// features render it directly with no feature-owned row or section wrapper. The
// rule bans the settings-era names so the seam keeps one vocabulary: identifiers
// starting with `NativeSettings`, `SwiftSettings` or `ComposeSettings`, the exact
// names `SettingsRow` / `SettingsSection` (and their `Props`), any string or
// template literal naming `native-settings` or `nativeSettings` (import and mock
// paths, testIDs, story ids, i18n keys), and files under those names.
const path = require("node:path")

const RETIRED_IDENTIFIER = /^(Native|Swift|Compose)Settings/
const RETIRED_ADAPTERS = new Set([
  "SettingsRow",
  "SettingsRowProps",
  "SettingsSection",
  "SettingsSectionProps",
])
const RETIRED_STRING = /native-settings|nativeSettings/
const RETIRED_FILE_STEMS = new Set(["settings-row", "settings-section"])

function isRetiredIdentifier(name) {
  return RETIRED_IDENTIFIER.test(name) || RETIRED_ADAPTERS.has(name)
}

function isRetiredFile(filename) {
  const base = path.basename(filename)
  const stem = base.split(".")[0]
  return base.startsWith("native-settings") || RETIRED_FILE_STEMS.has(stem)
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow the retired native settings seam names; use NativeList*.",
    },
    schema: [],
    messages: {
      retiredIdentifier:
        "`{{name}}` is retired; use NativeList* from @/components/chrome (ADR 072).",
      retiredString:
        "This string names the retired native settings seam; use the native-list / nativeList form of NativeList* from @/components/chrome (ADR 072).",
      retiredFile:
        "This file name is retired; the seam is NativeList* in @/components/chrome (ADR 072).",
    },
  },

  create(context) {
    const reported = new Set()

    function checkIdentifier(node) {
      if (!isRetiredIdentifier(node.name)) return
      const key = node.range.join(":")
      if (reported.has(key)) return
      reported.add(key)
      context.report({
        node,
        messageId: "retiredIdentifier",
        data: { name: node.name },
      })
    }

    return {
      Program(node) {
        if (isRetiredFile(context.filename)) {
          context.report({ node, messageId: "retiredFile" })
        }
      },
      Identifier: checkIdentifier,
      JSXIdentifier: checkIdentifier,
      Literal(node) {
        if (typeof node.value === "string" && RETIRED_STRING.test(node.value)) {
          context.report({ node, messageId: "retiredString" })
        }
      },
      TemplateElement(node) {
        const cooked = node.value.cooked ?? node.value.raw
        if (RETIRED_STRING.test(cooked)) {
          context.report({ node, messageId: "retiredString" })
        }
      },
    }
  },
}
