// Files that still draw a hairline separator by hand, each with the
// design-system slice that removes it (docs/mobile/design-system-audit/
// migration-roadmap.md). ad-hoc-separator-allowlist.test.js fails on a stale
// entry and on growth past its ceiling: remove an entry when its file is migrated.
const adHocSeparatorAllowlist = [
  "src/features/home/ui/today-timeline.tsx", // 5.9 Home timeline divider
]

module.exports = { adHocSeparatorAllowlist }
