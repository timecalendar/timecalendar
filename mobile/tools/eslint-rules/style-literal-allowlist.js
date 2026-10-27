// Files that still write color, typography, legacy-shadow, spacing or radius
// literals in styles, each with the categories it still violates and the
// design-system slice that removes them (docs/mobile/design-system-audit/
// migration-roadmap.md). eslint.config.js turns off only the listed categories
// for each file; style-literal-allowlist.test.js fails on a stale category and on
// growth past the per-category ceilings. A migration slice deletes its files (or
// the categories it cleans) here in the same PR.
const styleLiteralCategoryOption = {
  colorLiteral: "colors",
  typographyLiteral: "typography",
  legacyShadow: "shadows",
  spacingLiteral: "spacing",
  radiusLiteral: "radius",
}

const styleLiteralAllowlist = [
  {
    path: "src/features/calendar/renderer/owned-calendar-chooser.tsx",
    categories: ["colorLiteral", "radiusLiteral", "spacingLiteral"],
  }, // 5.10 chooser modal → native menu/sheet
  {
    path: "src/features/calendar/renderer/owned-calendar-header.tsx",
    categories: ["radiusLiteral", "spacingLiteral", "typographyLiteral"],
  }, // 5.11
  {
    path: "src/features/calendar/renderer/owned-calendar-page.tsx",
    categories: ["radiusLiteral", "spacingLiteral", "typographyLiteral"],
  }, // 5.11
  {
    path: "src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx",
    categories: ["typographyLiteral"],
  }, // 5.10
  {
    path: "src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx",
    categories: ["spacingLiteral"],
  }, // 5.10
  {
    path: "src/features/event-checklists/ui/checklist-progress-indicator.tsx",
    categories: ["typographyLiteral"],
  }, // 5.8
  {
    path: "src/features/home/ui/home-screen.tsx",
    categories: ["spacingLiteral"],
  }, // 5.9
  {
    path: "src/features/home/ui/home-screen/welcome-card.tsx",
    categories: ["typographyLiteral"],
  }, // 5.9
]

module.exports = { styleLiteralAllowlist, styleLiteralCategoryOption }
