---
kind: ticket
id: T03
epic: E02
status: planned
traces-to: [P02, P04, D01, D02, D05]
depends-on: [T01]
size: L
confidence: medium
---

# T03 — Worldwide native time-zone search

## Outcome

Users can follow the device time zone or find and keep a manual zone through offline
common-city search, with native presentation and unchanged event-time interpretation.

## Scope

Use T01's native row/host contract. Add compatible pinned @vvo/tzdb data and a bounded CLDR
label import through normal package management. Build a small feature-owned index over
supplied city/country/zone names, with case/accent normalization and localized labels.
Preserve supported identifiers/aliases beyond display groups; widen validation without
silently rewriting saved names. Keep date-fns-tz/Intl conversion. Remember the manual zone
under the device-preference storage policy.

Show Use device time zone and a readable, noneditable effective-zone row in automatic mode.
Manual selection opens a tall native iPhone sheet with close action and iOS 26 bottom-toolbar
search; older iOS/iPad adapt natively. Android uses full-screen native search/back behavior.
Keep the timezone-settings URL. Validate sheet/search/list integration early, then connect
the catalog and preferences within the same complete chooser ticket.

## Non-goals

Region-first wizard, custom glass, online geocoding, location access, handwritten city/DST
tables, exhaustive settlement search, replacement time arithmetic, or schedule changes.

## Definition of done
- Lyon finds Europe/Paris; common cities, countries, zone identifiers, and supplied translated
  exemplar names are indexed offline. Missing translations fall back to supplied names.
- Automatic/manual transitions retain the last manual choice; first manual use starts from
  the effective device zone. Unsupported values do not crash or erase recoverable preference data.
- Current offsets use now; event offsets use the event instant. UTC and fractional offsets work.
- Existing curated values survive; no library grouping silently substitutes a stored identifier.
- Record package/license/update procedure and reconcile the curated-only zone spec/decision.
- Empty query is useful; current selection and no-results states are clear and localized.
- Search matches library-backed common cities/countries/zones and translated aliases.
- Selecting validates, saves, and closes; close/back/swipe without selection leaves values intact.
- Keyboard/search clear/back transitions work without double navigation or scrolling ownership.
- Large lists use an appropriate native lazy list; do not render every search result as a
  separately hosted control. Offsets refresh when reopening/resuming the screen.
- Automated route/selection proofs and resulting screen/spec documentation are included.

## Acceptance and verification

Test old preferences, aliases, invalid/corrupt input, unsupported runtime names, manual memory,
accent normalization, London/Londres, Montreal/Montréal, and Lyon. Include winter/summer Paris,
Kathmandu, a half-hour zone, and all-day invariance. Check the unchanged server validator accepts
representative selectable names. A mock must not imply all OS databases support every new alias.

Test mode toggles, remembered values, query/filter/empty state, select/cancel, unavailable-zone
handling, and existing deep links. Exercise event/push formatting through the same preference
resolver. Run edited tests and the [mobile gates](../../roadmap.md#verification-convention).
First validate Router sheet + native toolbar search + list inset ownership on a supported
device before completing the full chooser. Escalate if actual native fidelity requires
architecture beyond D01; no custom overlay fallback by default.

## Likely work sites and reading

`mobile/package.json`, `mobile/package-lock.json`, `mobile/src/features/settings/prefs/`,
`mobile/src/features/settings/data/` (catalog adapter is new), `mobile/src/storage/index.ts`,
`mobile/src/features/settings/ui/timezone-settings-screen.tsx`, and FR/EN catalogs. Read
[D02](../../decisions/D02-timezone-libraries.md), `openspec/changes/mobile-timezone-preference/`,
`docs/mobile/architecture-book/decisions/035-display-timezone-preference.md`, and
`server/src/modules/shared/validators/is-iana-timezone.ts`. Existing paths verified on main.

`mobile/src/features/settings/ui/timezone-settings-screen.tsx`, settings catalog/preferences,
`mobile/src/app/_layout.tsx`, `mobile/src/app/timezone-settings.tsx`, `mobile/src/components/chrome/`,
and `mobile/jest/setup-expo-ui.ts`. Chooser route/screen are new. Read [D01](../../decisions/D01-native-presentation.md),
[D02](../../decisions/D02-timezone-libraries.md), and installed Router Stack.SearchBar/Toolbar APIs.
Existing work sites verified against recorded main.

## Size and confidence drivers

L: one complete chooser, using maintained data and existing conversion APIs. Catalog wiring
and preference memory are implementation steps of that chooser. Medium confidence: native
sheet search, runtime aliases, localization packaging, and downgrade behavior need proof.

## QA and sensitive surfaces

Owner inspects understandable names and offsets. Search requires no location/network access.
Document old-build downgrade behavior rather than clearing new values to mask incompatibility.

Owner checks iPhone close/search placement, Android back/search, tablet sizing, dark/glass,
large text, keyboard, and screen-reader selected/disabled states. No search terms are logged.
