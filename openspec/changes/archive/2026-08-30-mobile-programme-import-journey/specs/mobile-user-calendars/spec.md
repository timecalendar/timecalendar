# mobile-user-calendars — delta

## MODIFIED Requirements

### Requirement: A reachable "Mes calendriers" management screen lists every held calendar

The app SHALL provide a presentational user-calendars management screen (and a
deep-linkable thin route, a `Stack` sibling of the tabs, reached from the Settings
calendar summary) that reads the reactive `useUserCalendars()` list and renders one
row per held calendar. Each row SHALL show the calendar's **effective display name** as the title
and its `schoolName` (falling back to "Calendrier personnel" when absent) as the subtitle.

The effective display name SHALL be derived by a pure helper in the feature's `data/` sublayer that
returns the stored name **trimmed** when the result is non-empty and a null/absent value otherwise;
the UI SHALL render the localized fallback "Mon emploi du temps" / "My timetable" for that
null result. Stored values SHALL NEVER be rewritten — the fallback is display-only, so no backfill
is required for the empty and whitespace-only names present in production data. Every surface that
renders a calendar's name — including the delete-confirmation label — SHALL use this helper rather
than reading `calendar.name` directly.

The row title SHALL render as body weight (a
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

#### Scenario: The screen lists held calendars with the effective name + school
- **WHEN** the management screen renders with a non-empty `useUserCalendars()` list
- **THEN** it lists one row per calendar, each showing the effective display name and the
  school subtitle (or "Calendrier personnel" when absent)

#### Scenario: An empty or whitespace-only stored name renders the localized fallback
- **WHEN** a held calendar's stored name is empty or contains only whitespace
- **THEN** the row title renders the localized "Mon emploi du temps" / "My timetable"
- **AND** the stored value is left untouched

#### Scenario: A stored name is trimmed for display only
- **WHEN** a held calendar's stored name has leading or trailing whitespace around real text
- **THEN** the row title renders the trimmed text
- **AND** the stored value is unchanged

#### Scenario: An over-long legacy name still renders
- **WHEN** a held calendar's stored name exceeds the 100-character input maximum
- **THEN** it renders as stored
- **AND** no validation error or truncation is applied to the existing row

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
