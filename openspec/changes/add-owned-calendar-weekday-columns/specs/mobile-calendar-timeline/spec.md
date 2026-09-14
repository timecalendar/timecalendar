## MODIFIED Requirements

### Requirement: T04 aligns dated headers and clock columns with a non-color Today cue

The owned week surface SHALL render one vertically pinned, clipped date-header viewport beneath the existing native month/year title and above vertical clock motion. The viewport SHALL reserve the same fixed hour-gutter width as the timed surface and SHALL contain previous/current/next visual header slots derived from the same ordered column records as their clock pages. Each slot SHALL render one equal-width cell per visible date. A callable Reanimated event handler attached through an animated PagerView wrapper SHALL project the existing pager's continuous native position and offset into shared values and a UI-thread header-strip transform, so each visual header remains aligned with and moves in the same direction and progress as its clock page without adding another pager, responder, gesture owner, timer, or per-frame JavaScript state write. Each header SHALL show a locale-aware weekday and calendar date. The effective display-zone date matching Today SHALL have a visible shape or typography cue in addition to any color and SHALL expose Today meaning semantically without becoming a selectable date control.

#### Scenario: Seven dated columns align

- **WHEN** weekends are enabled at a supported width
- **THEN** the header shows seven equal-width localized Monday-to-Sunday cells beside the gutter spacer
- **AND** each cell aligns with the corresponding vertical clock column on all three bounded pages

#### Scenario: Five dated columns redistribute width

- **WHEN** weekends are disabled at the same width
- **THEN** five equal-width Monday-to-Friday header and clock columns fill the available width
- **AND** no blank Saturday/Sunday lanes, partial week, or horizontal column scroller remains

#### Scenario: Today is not conveyed by color alone

- **WHEN** one visible column matches the current date in the effective display zone
- **THEN** that column has a visible non-color shape or typography distinction and localized Today semantics
- **AND** changing only locale or device timezone cannot select the wrong display-zone date

#### Scenario: Week headers stay vertically pinned and move with horizontal paging

- **WHEN** the student scrolls vertically or holds an unsettled horizontal page transition
- **THEN** the header remains visible during vertical motion, and horizontal motion carries the source header out while the matching destination header and grid enter together from the pager's native progress
- **AND** the native title, canvas label, Agenda range, committed anchor, and accessible date context remain on the settled revision until an accepted week settle

#### Scenario: Pager wrapper receives a callable UI-thread handler

- **WHEN** PagerView delivers fractional forward or backward `onPageScroll` position and offset events
- **THEN** its JavaScript wrapper invokes a callable Reanimated handler and the corresponding shared values drive the header transform on the UI thread
- **AND** React Native `Animated`, `runOnJS`, React state, timers, or an independent animation do not process each frame

#### Scenario: Cancelled horizontal motion recenters one coherent surface

- **WHEN** a drag snaps back, app inactivity cancels motion, the generation is replaced, layout policy changes, or a stale page callback arrives
- **THEN** the header strip and native pager return to the center slot without committing or announcing a different week
- **AND** no independently animated header, second pager settlement, or obsolete transform remains

### Requirement: Wiring proven in CI grid and performance on-device

The change MUST prove complete-day geometry, native settled-offset retention, explicit clock formatting, native scroll/pager ownership, five/seven civil-date derivation, dated header/grid alignment, Today identity, default/persisted preference behavior, bounded seven-day paging, localized settled semantics, Calendar remount and Week/Agenda restoration, unchanged Agenda dates, retained event activation, revision rejection, and current owned-renderer integrity with focused Jest and repository checks. The changed-code React Doctor scan MUST report no blocking warning or error in the renderer without suppression, gate weakening, compiler opt-out, or moving the same issue behind an alias. The implementation MUST preserve the three established Maestro journeys and their shared Agenda helper. Native readability, Dynamic Type, header/grid alignment, gesture continuity, preference restart, VoiceOver/TalkBack traversal, and retained Calendar/Agenda checks SHALL be recorded through the ticket's testable build and owner checklist rather than claimed from this host.

#### Scenario: Dated columns are proven without a vendor mock

- **WHEN** focused pure, preference, renderer, Settings, and Calendar suites run
- **THEN** they exercise five/seven civil dates, weekend identity, default/false/true persistence, Today identity, equal column structure, locale/zone labels, native owner configuration, pager settlement, and retained vertical offset
- **AND** they require no calendar-kit Jest setup, fallback renderer, handwritten worklet runtime, host-locale assumption, or device-local date arithmetic

#### Scenario: Callable Reanimated progress is proven at the PagerView boundary

- **WHEN** the focused renderer suite delivers fractional page-scroll events through the actual prop retained by the supported PagerView mock
- **THEN** that prop is callable and its Reanimated shared values/style project forward and backward header motion before settlement
- **AND** cancellation and replacement paths recenter the same values without committing or announcing a week

#### Scenario: Retained paging, Agenda, and details wiring is proven

- **WHEN** the Calendar screen suite hides weekends, pages, switches to Agenda and back, and activates a fabricated weekend event
- **THEN** paging advances seven civil dates, Week retains its clock offset, Agenda retains its seven-day range, and the existing unified event-details route receives that event identity

#### Scenario: Owned renderer footprint remains coherent

- **WHEN** source, storage classification, dependency, Jest, coverage, lint, formatting, changed-code React Doctor, Maestro harness, and repository-contract checks run
- **THEN** the renderer is split into bounded feature-private coordination and passive presentation units and the changed-code scan reports no blocking diagnostic
- **AND** no React Native `Animated`, manual-memoization workaround, vendor, alternate pager/scroll path, fallback, compatibility, duplicate renderer, suppression, or unrelated sensitive-surface change appears

#### Scenario: Native evidence is not fabricated

- **WHEN** local verification completes on the non-virtualized development host
- **THEN** it records deterministic automated results without claiming native readability, restart, layout, gesture, or assistive-technology execution
- **AND** the testable build identifies the revision and exact T04 device checklist still awaiting owner verification
