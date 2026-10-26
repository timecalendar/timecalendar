// Files that still render a raw React Native TextInput, each with the
// design-system slice that removes it (docs/mobile/design-system-audit/
// migration-roadmap.md). raw-text-input-allowlist.test.js fails on a stale entry
// and on growth past its ceiling: remove an entry when its file is migrated.
const rawTextInputAllowlist = [
  "src/features/event-checklists/ui/event-checklist.tsx", // 5.8 inline checklist row editor
]

module.exports = { rawTextInputAllowlist }
