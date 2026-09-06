## ADDED Requirements

### Requirement: Responsive decisions use measured container width

Responsive feature UI SHALL derive its layout mode from the positive width reported by the laid-out container that owns the usable content area. The shared resolver SHALL return `compact` below 600 points and `tablet` at 600 points or above, SHALL use compact behavior before a positive measurement exists, and SHALL NOT infer layout from device model, operating system, or a global window when the content is nested or capped.

#### Scenario: Compact width resolves compact

- **WHEN** a content owner reports a width of 599 points
- **THEN** the shared resolver returns compact mode

#### Scenario: Tablet width resolves tablet

- **WHEN** a content owner reports a width of 600 points
- **THEN** the shared resolver returns tablet mode

#### Scenario: Nested content follows its own width

- **WHEN** the window is 1024 points wide but a nested or presented content owner reports 560 points
- **THEN** that content resolves compact mode from 560 rather than tablet mode from the window

### Requirement: Content uses semantic lanes and adaptive gutters

The shared responsive contract SHALL provide readable, standard, and full-bleed lanes. Readable content SHALL cap at 640 points, standard content SHALL cap at the existing 800-point maximum, and full-bleed content SHALL use all width inside its safe-area/chrome owner. Compact mode SHALL use `Spacing.four` horizontal gutters and tablet mode SHALL use `Spacing.six`; screens SHALL NOT duplicate safe-area insets or add device-specific margins.

#### Scenario: Readable form on a tablet

- **WHEN** a form's measured container is 1024 points wide
- **THEN** its content remains centered at no more than 640 points with tablet gutters outside the lane

#### Scenario: Standard list on a tablet

- **WHEN** a grouped list's measured container is 1024 points wide
- **THEN** its rows remain centered at no more than 800 points

#### Scenario: Information-dense surface uses available width

- **WHEN** a calendar canvas is rendered at a supported portrait-tablet width
- **THEN** it uses the full safe-area width and does not inherit the readable or standard maximum

### Requirement: Adaptive columns remain bounded and accessible

A screen MAY use two columns only when its measured width is at least 834 points, the columns contain independent scan groups, and source/focus order remains meaningful from top to bottom. Forms SHALL remain a single readable column. At smaller widths or under content/font stress that cannot preserve the contract, the screen SHALL render one column.

#### Scenario: 768-point portrait tablet stays single-column

- **WHEN** an adaptive section layout reports 768 points
- **THEN** it uses tablet gutters and its semantic lane but does not activate the two-column composition

#### Scenario: Independent groups may use columns

- **WHEN** an adaptive section layout reports at least 834 points and both groups preserve source and focus order
- **THEN** it may render the two groups in two columns

#### Scenario: Form remains readable

- **WHEN** a create or edit form reports 1024 points
- **THEN** its controls remain in one readable column

### Requirement: Native chrome and presentation remain authoritative

Responsive changes SHALL preserve Expo Router Stack and the owned native-tabs/chrome seam as the navigation authority. The changelog sheet SHALL remain an iOS form sheet and Android full-screen modal, menus/alerts/pickers/header actions/FABs SHALL retain platform conventions, and responsive sizing SHALL apply to inner content rather than replacing native presentation.

#### Scenario: Changelog opens on tablet

- **WHEN** the changelog sheet is opened on a supported tablet
- **THEN** iOS uses the configured native form sheet, Android uses the configured full-screen modal, and the inner body uses the readable lane

#### Scenario: Native tabs remain behind the seam

- **WHEN** tablet layout changes are implemented for tab routes
- **THEN** feature code does not import or replace the unstable native-tabs API outside the existing chrome seam

### Requirement: Every supported route has a tablet disposition

`docs/mobile/tablet-quick-wins.md` SHALL contain every screen in the tablet epic inventory with its route/surface, observed current behavior, implemented quick win or explicit no-change outcome, priority, owning workstream, responsive rule/breakpoint, and verification evidence. The ledger SHALL include Home, all Calendar modes/states, event details/checklist, personal events/form, every onboarding/import route, Settings/management/utility screens, splash/dev-import transient states, and routing-only checks for `/profile` and `/more`.

#### Scenario: A screen needs no visual change

- **WHEN** the audit determines an existing tablet layout is already intentional
- **THEN** the ledger records `no change needed` with its reason and routing/verification evidence

#### Scenario: Final regression reconciles implementation

- **WHEN** the implementation workstreams have landed
- **THEN** the final pass updates every ledger row with what shipped or why the no-change decision remains correct

### Requirement: Responsive behavior is proven at representative widths

Shared resolver tests SHALL cover 390, 599, 600, 768, 800, 834, and 1024 points. Every changed screen SHALL have focused compact/tablet component coverage for its relevant loaded, loading, empty, error, dense, keyboard, or overlay states. Static checks SHALL preserve native presentation, route redirects, orientation/device configuration, dependency manifests, and existing Maestro selectors.

#### Scenario: Boundary proof runs in CI

- **WHEN** the mobile unit suite runs
- **THEN** 599 resolves compact, 600 resolves tablet, 768 and 800 use tablet single-column behavior, and 834 and 1024 are eligible for bounded adaptive columns

#### Scenario: Phone behavior remains stable

- **WHEN** a changed screen is rendered at 390 points
- **THEN** it retains the existing phone composition, interactions, safe areas, and touch targets

#### Scenario: Native contract stays unchanged

- **WHEN** tablet responsive work is complete
- **THEN** dependency manifests and native orientation/device-family configuration have no responsive-feature changes
