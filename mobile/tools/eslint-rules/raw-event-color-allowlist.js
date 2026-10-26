// Files that still fill a view with a raw event color, each with the
// design-system slice that removes it (docs/mobile/design-system-audit/
// migration-roadmap.md). raw-event-color-allowlist.test.js fails on a stale
// entry and on growth past its ceiling: remove an entry when its file is migrated.
const rawEventColorAllowlist = [
  "src/features/calendar/ui/event-details-content.tsx", // 5.8 title dot and TagBubble
]

module.exports = { rawEventColorAllowlist }
