// Feature screens that still import React Native's Text or Modal, each with the
// primitives it still imports and the design-system slice that removes them
// (docs/mobile/design-system-audit/migration-roadmap.md). eslint.config.js turns
// off only the listed primitives for each file; raw-primitive-allowlist.test.js
// fails on a stale primitive and on growth past the per-primitive ceilings. A
// migration slice deletes its files (or the primitives it removes) here in the
// same PR.
const rawPrimitiveCategoryOption = {
  rawText: "text",
  rawModal: "modal",
}

const rawPrimitiveAllowlist = [
  {
    path: "src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx",
    categories: ["rawText"],
  }, // 5.10 calendar header title
]

module.exports = { rawPrimitiveAllowlist, rawPrimitiveCategoryOption }
