// Files that still build a loading or list-empty state by hand, each with the
// design-system slice that removes it (docs/mobile/design-system-audit/
// migration-roadmap.md). ad-hoc-status-allowlist.test.js fails on a stale entry
// and on growth past its ceiling: remove an entry when its file is migrated.
const adHocStatusAllowlist = [
  "src/features/activity/ui/activity-screen.tsx", // 5.4 loading and older-page footer
  "src/features/calendar-sources/ui/dev-import-screen.tsx", // 5.7 developer import progress
]

module.exports = { adHocStatusAllowlist }
