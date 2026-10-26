// Files that still build a text button from a raw Pressable, each with the
// design-system slice that removes it (docs/mobile/design-system-audit/
// migration-roadmap.md). raw-button-allowlist.test.js fails on a stale entry and
// on growth past its ceiling: remove an entry when its file is migrated.
const rawButtonAllowlist = [
  "src/features/calendar-sources/ui/qr-action-button.tsx", // 5.7 QR permission actions
  "src/features/calendar/ui/agenda-list.tsx", // 5.10 agenda event tiles
  "src/features/calendar/ui/calendar-screen/calendar-screen-actions.tsx", // 3.8 header actions and FAB
  "src/features/calendar/ui/calendar-screen/calendar-screen-status.tsx", // 5.10 calendar refresh
  "src/features/calendar/ui/event-details-actions.tsx", // 5.8 event-details actions
  "src/features/changelog/ui/changelog-sheet-screen.tsx", // 3.8 header Close
  "src/features/event-checklists/ui/event-checklist.tsx", // 5.8 checklist add and items
  "src/features/home/ui/home-screen/today-section.tsx", // 5.9 Home today events
  "src/features/home/ui/home-screen/upcoming-section.tsx", // 5.9 Home "See all" and events
  "src/features/home/ui/today-timeline.tsx", // 5.9 timeline presses
  "src/features/home/ui/upcoming-scroller.tsx", // 5.9 scroller presses
  "src/features/onboarding/ui/programme-screen.tsx", // 3.8 header Skip
  "src/features/school-selection/ui/school-group-picker-screen.tsx", // 5.5 school-group Confirm
  "src/features/school-selection/ui/school-row.tsx", // 3.6 ListRow
]

module.exports = { rawButtonAllowlist }
