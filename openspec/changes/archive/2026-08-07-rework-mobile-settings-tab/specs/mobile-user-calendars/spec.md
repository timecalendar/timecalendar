## MODIFIED Requirements

### Requirement: A reachable "Mes calendriers" management screen lists every held calendar

The app SHALL provide a presentational user-calendars management screen (and a
deep-linkable thin route, a `Stack` sibling of the tabs, reached from the Settings
calendar summary) that reads the reactive `useUserCalendars()` list and renders one
row per held calendar. Each row SHALL show the calendar's name (falling back to a
"Calendrier" placeholder when empty) as the title and its `schoolName` (falling
back to "Calendrier personnel" when absent) as the subtitle — Flutter
`user_calendar_list_item.dart` parity. The row title SHALL render as body weight (a
`Platform.select` override), not the `ThemedText` default that reads as emphasis.
The empty state SHALL be gated on the read resolving: because `useLiveQuery` starts
with an empty array and resolves asynchronously, the screen SHALL track a `loaded`
flag (the `useLiveQuery` `updatedAt`, which is undefined until the first resolve) and
SHALL render neither the empty state nor any live region until the read has loaded —
so the empty state neither flashes nor false-announces "no calendars" on entry. When
loaded with no calendars the screen SHALL render an accessible, **centered** empty
state (a title + a `textSecondary` line that is a polite live region with a `text`
role), not a crash or a blank. Each row SHALL be a plain non-touchable container so
its two controls (the row-level visibility toggle and the delete button) never nest
inside a parent touchable, and the container SHALL NOT declare `accessible={true}`
(which would flatten the two-target design).

#### Scenario: The screen lists held calendars with name + school
- **WHEN** the management screen renders with a non-empty `useUserCalendars()` list
- **THEN** it lists one row per calendar, each showing the calendar name (or the
  "Calendrier" placeholder when empty) and the school subtitle (or "Calendrier
  personnel" when absent)

#### Scenario: The empty state waits for the read to resolve
- **WHEN** the management screen mounts before `useUserCalendars()` has resolved
- **THEN** neither the empty state nor its live region renders, so no "no calendars"
  is announced on entry

#### Scenario: Empty management state
- **WHEN** the read has resolved and no calendars are held
- **THEN** the screen shows an accessible, centered empty state (polite live region,
  text role), not a crash or a blank

#### Scenario: The management screen is reachable
- **WHEN** the user activates the calendar summary on Settings
- **THEN** the app navigates to the user-calendars management screen
- **AND** the screen remains directly deep-linkable as a Stack sibling of the tabs

### Requirement: An add affordance routes to school selection

The screen SHALL provide an accessible add affordance rendered as a **native header
action** (`Stack.Screen options.headerRight`) — a primary-tinted `smallBold`
`Pressable` mirroring the shipped event-details header-action pattern, with a short
visible label (`userCalendars.add.short`, "Add"/"Ajouter"), the full "Ajouter un
calendrier" string kept as its `accessibilityLabel`, `accessibilityRole="button"`,
and a pressed-state affordance — that navigates to school selection
(`/onboarding/school`) — Flutter FAB parity. The add SHALL NOT render as an
off-platform in-body bordered text button. Settings provides the calendar-management
front door; it SHALL NOT duplicate the Add calendar action.

#### Scenario: The add header action routes to school selection
- **WHEN** the user activates the header add action
- **THEN** the app navigates to `/onboarding/school`

#### Scenario: The add action is a native header action with a full accessible name
- **WHEN** assistive tech reads the add control
- **THEN** it is a header-right button whose visible label is the short
  "Add"/"Ajouter" and whose `accessibilityLabel` is the full "Ajouter un
  calendrier" string

#### Scenario: Settings does not duplicate the add action
- **WHEN** the Settings hub renders
- **THEN** it links to calendar management through its summary
- **AND** it does not render a separate Add calendar action
