## ADDED Requirements

### Requirement: T01 exposes a stable owned Calendar shell

The Calendar day/week branch SHALL render a feature-owned React Native surface with a localized date heading and a stable positive-size canvas. The date text SHALL be exposed as a heading, use the effective display zone and active French or English locale, and remain correct across Calendar mount/unmount and tab leave/return. The shell SHALL render no timeline events and SHALL NOT represent that intentional absence as an empty local-data result.

#### Scenario: Calendar opens the owned shell

- **WHEN** the student opens Calendar in the shell mode
- **THEN** a localized date heading and owned canvas render without a crash
- **AND** the heading is discoverable with heading semantics

#### Scenario: Calendar returns to a stable shell

- **WHEN** the Calendar screen unmounts and mounts again, or the student leaves its tab and returns
- **THEN** the owned heading and canvas render again without stale vendor state or duplicate renderers

#### Scenario: Stored events are not misreported as absent

- **WHEN** local events exist while T01's shell is active
- **THEN** the shell renders no event tiles by design
- **AND** it does not claim that the underlying event collection is empty
- **AND** the same events remain available through Agenda

### Requirement: T01 retains only working Calendar controls

Every enabled Calendar control at this milestone SHALL produce an observable supported result. The view selector SHALL expose the owned shell and Agenda; it SHALL NOT expose a Day/Week switch before the T05 day/week behavior exists. Add, Agenda selection, agenda refresh/retry, agenda event activation, and any retained Today action SHALL preserve their existing localized accessibility behavior. A Today action MAY remain only when it updates the selected date and visible date heading.

#### Scenario: View choices are implemented

- **WHEN** the student opens the Calendar view selector
- **THEN** every offered choice renders a distinct working surface
- **AND** no enabled choice silently does nothing

#### Scenario: Future controls are absent

- **WHEN** the T01 shell renders
- **THEN** no control offers paging, vertical scrolling, weekday selection, day/week switching, zoom, or event activation on the shell

#### Scenario: Retained controls remain accessible

- **WHEN** the student uses a retained Calendar action
- **THEN** it has a translated label, the platform minimum target, and an observable supported result

## MODIFIED Requirements

### Requirement: GestureHandlerRootView mounted at the app root

The app root layout SHALL retain `GestureHandlerRootView` from the already-present `react-native-gesture-handler` package as the outermost wrapper for the Expo 56 runtime and existing/future owned gesture consumers. The wrapper SHALL NOT be documented or tested as a calendar-kit requirement.

#### Scenario: Root layout retains the gesture owner

- **WHEN** `src/app/_layout.tsx` is inspected
- **THEN** a `GestureHandlerRootView` with a flex-filling style wraps the provider/Stack tree
- **AND** no comment or test claims that calendar-kit owns the wrapper

### Requirement: Day/week timeline screen as a brand surface

At the T01 milestone, the feature `renderer/` sublayer SHALL provide a read-only owned shell on the real Calendar route as a designed brand surface themed from `@/theme` tokens. It SHALL render a localized date heading and full-bleed empty canvas without importing a vendor renderer. Timeline events, the 7:00–21:00 grid, current-time indicator, day/week switching, paging, vertical scrolling, hour labels, weekday columns, weekend filtering, gestures, and zoom SHALL remain absent until their numbered slices land.

#### Scenario: Owned shell renders on the real route

- **WHEN** `timecalendar-dev://calendar` is opened
- **THEN** the feature-owned heading and canvas render through the existing thin Calendar route
- **AND** no calendar-kit, fallback, compatibility, or duplicate renderer mounts

#### Scenario: Brand surface uses owned tokens

- **WHEN** the shell renders in a supported theme
- **THEN** its surface, border, and text presentation derive from `@/theme` and shared semantic text primitives

#### Scenario: Timeline capabilities are intentionally absent

- **WHEN** the T01 shell is inspected or exercised
- **THEN** it contains no event tiles, grid, current-time indicator, paging, scroll viewport, weekday columns, weekend filtering, day/week switch, gesture, or zoom behavior

#### Scenario: Read-only shell has no event write path

- **WHEN** the shell is used
- **THEN** it neither mutates nor rewrites synced or personal event facts

### Requirement: Internationalization and accessibility

Every user-facing string added or retained on the T01 Calendar shell SHALL be translated in French and English with typed key parity. The visible date SHALL be locale- and display-zone-aware and exposed with heading semantics. Retained interactive controls SHALL expose translated labels, valid roles/states, and platform minimum targets; the shell SHALL not add inaccessible placeholder controls.

#### Scenario: French and English date headings

- **WHEN** the shell renders for the same selected date in French and English
- **THEN** its heading uses the corresponding locale and effective display zone
- **AND** neither catalog exposes a raw translation key

#### Scenario: Date heading is accessible

- **WHEN** assistive technology traverses the shell
- **THEN** it discovers the visible localized date as a heading

#### Scenario: Controls describe only supported actions

- **WHEN** assistive technology traverses the Calendar chrome
- **THEN** every enabled action has a translated label and supported result
- **AND** absent future timeline behavior is not exposed as an actionable element

### Requirement: Wiring proven in CI and shell stability checked on-device

The change MUST prove owned shell rendering, localized heading semantics, Calendar remount, shell/Agenda switching, retained agenda event activation, and removal of the vendor/configuration footprint with focused Jest and repository checks. It MUST preserve the three established Maestro journeys and their shared agenda helper. Native mount/return and agenda/details checks SHALL be recorded through the ticket's testable build and owner checklist rather than claimed from this host.

#### Scenario: Owned shell is proven without a vendor mock

- **WHEN** the focused renderer and Calendar screen suites run
- **THEN** they render the owned canvas and query the localized date by heading role
- **AND** they require no calendar-kit Jest setup or fallback renderer

#### Scenario: Retained Agenda and details wiring is proven

- **WHEN** the Calendar screen suite switches from the shell to Agenda and activates a fabricated event
- **THEN** Agenda renders and the existing unified event-details route receives that event identity

#### Scenario: Vendor footprint is absent

- **WHEN** dependency, source, patch, Jest, coverage, and lint configuration checks run
- **THEN** no calendar-kit package, lock entry, import, adapter, vendor file, patch, exclusive mock, renderer-only coverage key, or import exception remains

#### Scenario: Native evidence is not fabricated

- **WHEN** local verification completes on the non-virtualized development host
- **THEN** it records automated results and preserves the Maestro journeys without claiming native execution
- **AND** the testable build identifies the revision and device checklist still awaiting owner verification

### Requirement: Day and week retain full-bleed renderer ownership

The T01 owned shell SHALL receive the complete positive width and height of the existing Calendar content owner without an Agenda responsive cap. Agenda SHALL retain its measured standard lane. Existing platform-owned header structure and the working Add action SHALL remain outside the renderer, while controls for capabilities absent at this milestone SHALL not remain enabled.

#### Scenario: Owned canvas fills its owner

- **WHEN** the shell renders at phone or portrait-tablet width
- **THEN** its canvas fills the Calendar content owner without a responsive gutter or content cap

#### Scenario: Agenda retains its measured lane

- **WHEN** Agenda is selected
- **THEN** its headers, states, and rows remain in the existing measured standard lane
- **AND** its grouping, refresh, checklist, and event-press behavior remain unchanged

#### Scenario: Platform Calendar chrome remains screen-owned

- **WHEN** the T01 shell renders
- **THEN** the native header, working Add action, and working view selector remain owned by the Calendar screen
- **AND** the owned renderer exports no imperative chrome or navigation API

## REMOVED Requirements

### Requirement: Calendar-kit dependency, pure-JS, no native footprint

**Reason**: T01 is the approved clean cut from the patched vendor renderer to owned React Native presentation.

**Migration**: Remove the package and lock entries, vendor patch and patch-only tooling, and use the feature-owned T01 shell. No compatibility dependency or fallback is retained.

### Requirement: Calendar-kit is reached only through a chrome-wrapper seam

**Reason**: The vendor import surface no longer exists after the clean replacement.

**Migration**: Delete the vendor adapter/import exception and keep the owned renderer private to the Calendar feature; later slices extend that owned module without a calendar-kit-shaped API.

### Requirement: Day and week tiles surface checklist progress without rebuilding renderer events

**Reason**: T01 intentionally renders no day/week event tiles. Checklist progress remains available in Agenda and other existing owned surfaces until timeline event tiles return in T09.

**Migration**: Remove the calendar-kit sidecar projection and tile assertions; do not change checklist data or Agenda behavior. A later event-tile slice will define the owned timeline presentation contract.
