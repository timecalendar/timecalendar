# mobile-import-journey — delta

## ADDED Requirements

### Requirement: One ephemeral, feature-scoped import draft holds the institution and programme
The import journey SHALL own exactly one draft of the shape
`{ institution: { kind: "listed", school } | { kind: "unlisted", schoolName }, calendarName }`,
held in memory by a feature-scoped React context provider under
`mobile/src/features/onboarding/draft/` and mounted once on the onboarding Stack layout so it wraps
every route in that Stack, including the QR and iCal-URL siblings. The draft SHALL NOT be persisted
to `@/storage` (MMKV) or `@/db` (SQLite), and SHALL NOT introduce a new global store. The draft's
`school` value SHALL be the domain `SchoolListItem` projection, never a generated API type, so the
draft can be read from `ui/` without violating the `data/`-only generated-import boundary (B-1). The
read hook SHALL be total: outside the provider it SHALL return "no draft" rather than throwing.

#### Scenario: The draft is in-memory only
- **WHEN** the import journey's draft module is inspected
- **THEN** it holds the draft in React state behind a context provider
- **AND** it writes no MMKV key and no SQLite row, and adds no global store

#### Scenario: The provider wraps the whole onboarding Stack
- **WHEN** the onboarding Stack layout is inspected
- **THEN** it mounts the import-draft provider around the nested `Stack`
- **AND** the QR and iCal-URL routes, being Stack siblings, are inside it

#### Scenario: Reading the draft outside the provider is total
- **WHEN** the draft hook is used by a screen rendered outside the onboarding Stack
- **THEN** it returns "no draft"
- **AND** it does not throw

#### Scenario: The draft does not survive leaving the journey or a restart
- **WHEN** the onboarding Stack is dismissed, or the app is restarted
- **THEN** the draft is gone
- **AND** no persisted value can restore it

### Requirement: The unlisted institution path collects a free-text name and clears the legacy persisted selection
The school step's existing "I can't find my school" action SHALL open an institution-name step
instead of the iCal-URL step. That step SHALL collect a free-text **Institution name** which is
**required** in this normal UI path, whitespace-trimmed before validation and before storage in the
draft, and limited to 100 normalized characters. Submitting SHALL write an `unlisted` draft and
SHALL clear any legacy persisted school selection through the school-selection store's public
clear operation, so no previously selected school can be attributed to an unlisted import by code
that still reads that store.

#### Scenario: The unlisted path writes an unlisted draft
- **WHEN** the user submits a non-empty institution name
- **THEN** the draft's institution is `{ kind: "unlisted", schoolName: <trimmed value> }`
- **AND** the programme step is pushed

#### Scenario: An empty or whitespace-only institution name is rejected
- **WHEN** the user submits an empty or whitespace-only institution name
- **THEN** the screen stays open and shows accessible inline validation
- **AND** no draft is written and no navigation occurs

#### Scenario: An over-long institution name is rejected
- **WHEN** the user submits an institution name whose trimmed length exceeds 100 characters
- **THEN** the screen stays open and shows accessible inline validation
- **AND** no draft is written

#### Scenario: Entering the unlisted path cannot reuse a previously selected school
- **WHEN** a school selection is already persisted and the user completes the unlisted institution step
- **THEN** the persisted school selection is cleared
- **AND** the created calendar carries the entered institution name, never the previously selected school

### Requirement: The programme step collects an optional normalized name with a native Skip action
The programme step SHALL present a field labelled "Nom de formation" (FR) / "Programme name" (EN)
with an example placeholder such as "L3 Informatique" that is never persisted. The entered value
SHALL be whitespace-trimmed, SHALL accept Unicode, accents and emoji, and SHALL be limited to 100
normalized characters with accessible inline validation when exceeded. The primary Continue action
SHALL be available for a non-empty valid value and SHALL store the normalized value in the draft.
An empty programme name SHALL be reachable **only** through an explicit **Skip** action, which SHALL
be a quiet trailing native-stack header action — not a second primary button — using the platform
header treatment (iOS trailing header item, Android `headerRight`), translated text, an accessible
label, and a target of at least 44pt on iOS / 48dp on Android. Skip SHALL store an empty
`calendarName` and continue.

#### Scenario: Continue stores the normalized programme name
- **WHEN** the user enters "  L3 Informatique  " and activates Continue
- **THEN** the draft's `calendarName` is "L3 Informatique"
- **AND** the Connect step is pushed

#### Scenario: Unicode and emoji are accepted
- **WHEN** the user enters a value containing accents, non-Latin characters or emoji within the limit
- **THEN** the value is accepted verbatim into the draft

#### Scenario: The 100-character boundary is enforced on the normalized value
- **WHEN** the user submits a value whose trimmed length is exactly 100 characters
- **THEN** it is accepted
- **WHEN** the user submits a value whose trimmed length is 101 characters
- **THEN** the screen stays open with accessible inline validation and no navigation occurs

#### Scenario: Skip is the only route to an empty programme name
- **WHEN** the user activates the trailing header Skip action
- **THEN** the draft's `calendarName` is the empty string and the Connect step is pushed
- **AND** Continue is not available for an empty field, so an empty name is never invented

#### Scenario: Skip is a native header action, not a second primary button
- **WHEN** the programme screen's header is inspected on each platform
- **THEN** Skip is rendered as a trailing native-stack header item (iOS) or `headerRight` control (Android)
- **AND** it carries a translated accessible label and meets the platform minimum target size

### Requirement: The Connect step explains intranet access and links out only for a validated HTTP(S) URL
The Connect step SHALL explain that the student should open their institution's site on a computer or
in the device browser and find their timetable. It SHALL show an external-link action labelled with
the institution's name **only** when the draft's institution is `listed` and its `intranetUrl` passes
a pure HTTP(S) validation helper; for any other value — absent, empty, whitespace, a non-HTTP(S)
scheme such as `javascript:` or `file:`, or an unparseable string — and for every `unlisted` draft,
the step SHALL render the generic instructions with no link. The step SHALL always offer Back and
Continue, and Continue SHALL open the manual-import step directly. The Connect → manual-import
boundary SHALL remain an explicit navigation edge so a later assistant project can be inserted there
without changing the preceding screens.

#### Scenario: A valid intranet URL renders a labelled external link
- **WHEN** the draft holds a listed institution whose `intranetUrl` is an `http:` or `https:` URL
- **THEN** an external-link action labelled with the institution name is shown
- **AND** activating it opens that URL in the browser

#### Scenario: An unsafe or absent intranet URL renders no link
- **WHEN** the draft's `intranetUrl` is null, empty, whitespace, unparseable, or uses a scheme other than `http:`/`https:`
- **THEN** the generic Connect instructions are shown with no external-link action

#### Scenario: The unlisted path never shows an intranet link
- **WHEN** the draft holds an unlisted institution
- **THEN** the generic Connect instructions are shown with no external-link action

#### Scenario: Back and Continue are always available
- **WHEN** the Connect step is rendered in any draft state
- **THEN** both Back and Continue are available
- **AND** Continue pushes the manual-import step

### Requirement: One manual-import step orchestrates the existing QR and iCal URL routes
The manual-import step SHALL explain that the student can scan the QR code shown by their institution
or paste its iCal link, and SHALL offer both **Scan QR code** and **Paste an iCal link** actions from
that one screen. It SHALL navigate to the existing `/onboarding/qr-scan` and `/onboarding/ical-url`
routes and SHALL NOT duplicate their camera-permission handling, URL validation, pending/error state,
failure reporting, or calendar-creation logic.

#### Scenario: Both entry points are offered from one screen
- **WHEN** the manual-import step renders
- **THEN** it exposes an action that navigates to the QR route and an action that navigates to the iCal-URL route

#### Scenario: The step adds no import logic
- **WHEN** the manual-import screen is inspected
- **THEN** it contains no camera permission handling, no URL validation, no create call, and no failure/retry state

### Requirement: Calendar creation sends exactly one institution representation plus the normalized programme name
Calendar creation SHALL derive its institution and programme fields from the draft through one pure
function, and the create seam SHALL receive those fields explicitly rather than reading the draft
itself. A `listed` draft SHALL produce `{ url, schoolId, name }` with **no** `schoolName` key. An
`unlisted` draft SHALL produce `{ url, schoolName, name }` with **no** `schoolId` key. `name` SHALL be
the trimmed programme name, which may be the empty string. The previously hard-coded `Dev import`
literals SHALL be removed.

#### Scenario: A listed institution sends schoolId only
- **WHEN** a calendar is created from a listed draft
- **THEN** the create request carries `schoolId` and the normalized `name`
- **AND** the request body contains no `schoolName` key at all

#### Scenario: An unlisted institution sends schoolName only
- **WHEN** a calendar is created from an unlisted draft
- **THEN** the create request carries `schoolName` and the normalized `name`
- **AND** the request body contains no `schoolId` key at all

#### Scenario: A skipped programme sends an empty name
- **WHEN** a calendar is created from a draft whose `calendarName` is empty
- **THEN** the create request carries `name: ""` and the correct single institution field

#### Scenario: The hard-coded development literals are gone
- **WHEN** the calendar-sources create seam is inspected
- **THEN** no `Dev import` literal remains for `name` or `schoolName`

### Requirement: The QR and iCal-URL routes stay usable with no draft
The `/onboarding/qr-scan` and `/onboarding/ical-url` routes SHALL remain directly usable when opened
with no import draft — by a development deep link, an external link, a test, or restored navigation.
In that case creation SHALL send `name: ""` and `schoolName: ""`. These routes SHALL NOT redirect to
the journey, SHALL NOT block on a missing draft, and SHALL NOT crash.

#### Scenario: A direct QR route with no draft creates with empty metadata
- **WHEN** the QR route is opened with no draft and a valid code is scanned
- **THEN** the create request carries `name: ""` and `schoolName: ""`
- **AND** no redirect occurs and no error is shown for the missing draft

#### Scenario: A direct URL route with no draft creates with empty metadata
- **WHEN** the iCal-URL route is opened with no draft and a valid URL is submitted
- **THEN** the create request carries `name: ""` and `schoolName: ""`
- **AND** no redirect occurs and no error is shown for the missing draft

### Requirement: The draft survives a failed import and is cleared on success or on leaving the journey
A failed import SHALL preserve the draft and the entered URL so the student can retry or switch
between the QR and URL routes without re-entering their institution and programme. A successful
import SHALL clear the draft and leave the import journey rather than returning to the manual-import
step; the dismissal SHALL be guarded so a directly deep-linked route with a single navigation entry
falls back to its existing back behaviour instead of throwing.

#### Scenario: A failed import keeps the context
- **WHEN** creation, token resolution, or the durable upsert fails
- **THEN** the draft is unchanged and the entered URL remains available for retry
- **AND** switching from the QR route to the URL route (or back) still finds the same draft

#### Scenario: A successful import clears the draft and leaves the journey
- **WHEN** an import succeeds from inside the journey
- **THEN** the draft is cleared and the onboarding Stack is left
- **AND** the student is not returned to the manual-import step

#### Scenario: A successful import from a directly opened route does not throw
- **WHEN** an import succeeds on a route opened directly with a single navigation entry
- **THEN** the screen falls back to its existing dismissal behaviour without throwing

### Requirement: Journey strings are localized in FR and EN and every new control is accessible
Every user-facing string introduced by the journey SHALL be a flat typed i18next key present in both
`en.json` and `fr.json`, with parity enforced at compile time: titles, helper copy, field labels,
placeholders, validation messages, button labels, and accessibility labels and hints. Every new
interactive control SHALL declare an `accessibilityRole` and a translated `accessibilityLabel`,
inline validation SHALL be announced (`accessibilityLiveRegion="polite"` with an alert role), and
every new control SHALL meet at least 44pt on iOS / 48dp on Android.

#### Scenario: FR and EN catalogs stay in parity
- **WHEN** the change is typechecked
- **THEN** every new key exists in both catalogs and `tsc` reports no missing or extra key

#### Scenario: New controls are accessible
- **WHEN** the new screens are inspected
- **THEN** each interactive control declares a role and a translated label
- **AND** validation messages render as polite live regions with an alert role

### Requirement: The journey is verified by automated tests under the coverage gates
The journey SHALL be proven by the repository's Jest suite under its existing coverage thresholds
(90% logic / 70% global), with pure helpers and the create-fields derivation tested directly, the
`data/` layer proven by mocking the `customFetch` mutator, and the `ui/` screens tested against the
feature's own hooks. Device-only criteria — QR camera permission behaviour on both platforms,
external intranet links, VoiceOver/TalkBack, and Dynamic Type — SHALL be recorded as a
`(HUMAN: …)` note in `docs/react-native-migration/inbox/` and SHALL NOT block the change.

#### Scenario: The wire shape is asserted at the mutator seam
- **WHEN** the create path is tested
- **THEN** the captured request body is asserted for the presence of exactly one institution key and the absence of the other

#### Scenario: Device-only criteria are recorded, not blocking
- **WHEN** the change is completed
- **THEN** an inbox note tagged `(HUMAN: …)` records the camera-permission, external-link, screen-reader and Dynamic Type passes
- **AND** the change is not blocked on an emulator or device run
