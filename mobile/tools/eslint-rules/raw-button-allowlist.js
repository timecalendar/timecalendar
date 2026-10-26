// Files that still build a text button from a raw Pressable, each with the
// design-system slice that removes it (docs/mobile/design-system-audit/
// migration-roadmap.md). raw-button-allowlist.test.js fails on a stale entry and
// on growth past its ceiling: remove an entry when its file is migrated.
const rawButtonAllowlist = [
  "src/features/calendar-sources/ui/qr-action-button.tsx", // 5.7 QR permission actions
  "src/features/calendar/ui/calendar-screen/calendar-screen-status.tsx", // 5.10 calendar refresh
  "src/features/event-checklists/ui/event-checklist.tsx", // 5.8 checklist add and items
  "src/features/home/ui/home-screen/upcoming-section.tsx", // 5.9 Home "See all" and events
  "src/features/school-selection/ui/school-group-picker-screen.tsx", // 5.5 school-group Confirm
]

module.exports = { rawButtonAllowlist }
