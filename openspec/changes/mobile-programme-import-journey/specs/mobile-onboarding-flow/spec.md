# mobile-onboarding-flow — delta

## MODIFIED Requirements

### Requirement: The onboarding Stack is welcome-first, with the school step at its own route
The nested onboarding Stack SHALL be ordered so the welcome surface is its entry: the entry route
(`mobile/src/app/onboarding/index.tsx`) SHALL re-export the welcome screen, the school-picker step
SHALL live at its own route (`mobile/src/app/onboarding/school.tsx`), and the group-picker step
(`mobile/src/app/onboarding/groups.tsx`) SHALL remain registered and deep-linkable even though it is
no longer on the normal import path (its removal is a separate cleanup). The Stack SHALL additionally
register the import-journey steps as routes: `institution-name`, `programme`, `connect`, and
`import`. Each route SHALL remain a thin entrypoint that only re-exports a feature `ui/` sub-barrel
(the route-structure rule). The onboarding Stack layout SHALL mount the ephemeral import-draft
provider around the nested `Stack`, so every route in the group — including the `qr-scan` and
`ical-url` siblings — can read the draft, and the draft's lifetime is the Stack's. The `onboarding`
group SHALL remain a `Stack` sibling of the `(tabs)` group in the root layout. The development deep
links SHALL be: `timecalendar-dev://onboarding` (welcome),
`timecalendar-dev://onboarding/school` (school step),
`timecalendar-dev://onboarding/institution-name` (unlisted institution step),
`timecalendar-dev://onboarding/programme` (programme step),
`timecalendar-dev://onboarding/connect` (Connect step),
`timecalendar-dev://onboarding/import` (manual import step), and
`timecalendar-dev://onboarding/groups?schoolId=<id>` (the retained group step).

#### Scenario: The welcome surface is the entry route
- **WHEN** `mobile/src/app/onboarding/index.tsx` is located
- **THEN** it re-exports the welcome screen from `@/features/onboarding/ui`
- **AND** it is a one-line thin route entrypoint

#### Scenario: The school step has its own route
- **WHEN** `mobile/src/app/onboarding/school.tsx` is located
- **THEN** it re-exports `SchoolPickerScreen` from `@/features/school-selection/ui`

#### Scenario: The journey steps are thin routes over the onboarding feature
- **WHEN** the `institution-name`, `programme`, `connect` and `import` routes are located
- **THEN** each is a one-line re-export from `@/features/onboarding/ui`
- **AND** each screen's colocated test lives beside the screen, outside `src/app/`

#### Scenario: The layout mounts the import-draft provider
- **WHEN** `mobile/src/app/onboarding/_layout.tsx` is inspected
- **THEN** it wraps the nested `Stack` in the import-draft provider
- **AND** the draft is discarded when the Stack is dismissed

#### Scenario: The onboarding group remains a Stack sibling of the tabs
- **WHEN** the root layout declares its routes
- **THEN** `onboarding` is a `Stack` screen sibling of the `(tabs)` group

#### Scenario: The group step remains registered but off the normal path
- **WHEN** the school step is used normally
- **THEN** no navigation reaches the group step
- **AND** `timecalendar-dev://onboarding/groups?schoolId=<id>` still resolves to it
