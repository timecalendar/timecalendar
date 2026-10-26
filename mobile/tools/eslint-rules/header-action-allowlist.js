// Files that still build a navigation-bar action by hand, each with the
// design-system slice that removes it (docs/mobile/design-system-audit/
// migration-roadmap.md). header-action-allowlist.test.js fails on a stale entry
// and on growth past its ceiling: remove an entry when its file is migrated.
const headerActionAllowlist = [
  "src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx", // 5.10 calendar view menu
]

module.exports = { headerActionAllowlist }
