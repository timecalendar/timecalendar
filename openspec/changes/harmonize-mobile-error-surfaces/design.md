# Design

## Context

See proposal.md for motivation. The mobile app uses React Native content and native SwiftUI/Compose
chrome behind `components/chrome`. It already has PrimaryAction, system-font text, semantic theme
tokens and platform symbols. WriteErrorNotice currently renders only secondary text. Native rename
mixes validation and remote failure in one message. Startup recovery precedes query/navigation.
The preceding calendar-import bug fixes are uncommitted and must remain intact.

## Goals / Non-Goals

Goals: one semantic API; consistent placement and action hierarchy across the inventory; platform
accessibility; readable dark mode/large text; no changes to retry, persistence or privacy semantics.
Non-goals: web/legacy Flutter/backend, global crash handling, dependency upgrades, native builds,
new modal/toast infrastructure, changes to permission guidance or destructive confirmations.

## Decisions

### 1. Three compositions over a common message and action contract

`@/components/error-surfaces` exports FieldError, ErrorNotice, ErrorState, ErrorAction, and
ErrorTextAction. `ErrorAction` has label, optional accessibilityLabel/testID/disabled/busy, and
onPress. FieldError has message, optional nativeID/testID/style. ErrorNotice has optional title,
message, optional action/testID/style and compact sizing. ErrorState requires title and message,
with optional primaryAction/secondaryAction/testID/style. Named slots limit competing actions.
ErrorTextAction shares quiet action styling for secondary navigation and support links.

These are content views, not route or scroll owners. Parent screens keep their RootPage, scroll,
keyboard and safe-area ownership. ErrorState must also render inside startup's SafeAreaView before
navigation exists. The surfaces consume translated strings and callbacks, never exceptions,
URLs/tokens, API clients, navigation, retry timers or global message queues.

### 2. Shared visuals with platform adaptations

Neutral backgroundElement surfaces, readable text, compact bold headings (approximately 20/28),
semantic error token plus exclamation symbol. Add `error` tokens using verified existing semantic
red pairs, independent from destructive action naming. No colored leading rails or large red panels.
Normal recovery remains brand-colored. Field errors sit beneath inputs. Inline notices grow with
content. Full states group heading/body before a filled primary and text secondary action.
Use existing SymbolView with iOS SF Symbol and Android Material symbol. Native system fonts, iOS
44pt / Android48dp targets, Android ripple and iOS pressed opacity remain inside shared controls.
No fixed text heights or line limits. A field's red outline, if used, denotes validation only.

Both platform research agents recommend RN composition for these content surfaces. SwiftUI
ContentUnavailableView is installed but iOS17+ while the app supports16.4; using it would require a
fallback and separate action composition without improving the feature API. Existing native settings
and dialogs keep SwiftUI/Compose through a chrome error adapter with the same semantic contract.

### 3. Announcements have one owner

A shared hook handles iOS queued VoiceOver announcements on message changes. Android shared RN
surfaces use a polite live region; native chrome adapters use their native semantics or one explicit
announcement owner. Avoid mounting a second announcing surface for the same error or retaining
feature-level announcements after adopting the adapter. Decorative icons are hidden; message and
action siblings do not merge into one inaccessible control. Field IDs remain available for input
association where supported. Assertive speech is not the default for recoverable operations.

### 4. Feature semantics remain local

QR failure becomes Retry + Change method. The latter dismisses to the existing import chooser;
choosing QR starts a fresh scanner and choosing iCal opens its input. The attempt can be abandoned,
but the journey draft remains. Align the existing active import-change specs/tests with this design.
iCal field error stays next to its field; operation notice appears before its single filled Import;
Report is a quiet link inside the operation notice; the sole filled Import action follows the notice. Retry still calls the checkpointed add-calendar seam.
Already-created-calendar event failure remains a sync-only result error. No loaded events/list rows
are removed to show a refresh/pagination failure. No permission error is invented from denial.

### 5. Migration inventory and ownership

| Area | Surfaces | Treatment |
| --- | --- | --- |
| QR | invalid payload, import failure | opaque notice over camera; full state with two actions |
| iCal | invalid URL, operation failure | field error; notice above Import, quiet Report |
| Import result | event hydration failure | full state, Retry + Continue; keep success unchanged |
| Guides | blocked catalogue, instructional image unavailable | full state; inline notice with alt/caption retained |
| School/group lists | initial failure, refresh failure, group selection guard | state if no content, notice if cached; field/group error |
| Activity | initial/cached/older-page failure | state/notice/footer notice; preserve rows and retry targets |
| Home/Calendar | sync failure | notice, cached events remain |
| Institution/programme | name validation | field error |
| Personal-event fields | title/date validation | field error |
| Feedback | email/message validation, submit failure | field errors + notice; preserve draft/sole submit |
| Write failures | user calendars, hidden events, event details, checklist, personal-event actions | notice near operation; no duplicate action |
| Native settings | about link, notification sync | native notice adapter; pending/waiting/success stay non-error |
| Native rename | too-long name, save failure | split error kind; native field error vs operation notice |
| Native numeric editor | invalid draft | retain native supporting text; semantic styling/announcement |
| Environment recovery | pre-navigation failure | provider-independent state; progress remains progress |
| Dev import | failed seed | notice; preserve development-only guard |

After migration remove WriteErrorNotice and bespoke retry/error styling that has no remaining use.
Preserve test IDs for meaningful existing controls; replace removed QR controls with change-method.
Existing confirmations, permission screens, decorative logo fallbacks, and valid empty/search-empty
states are explicitly outside the error migration. No global error boundary exists; none is added.

## Risks / Trade-offs

- Native screen readers differ → unit-test announcement ownership and run explicit device QA.
- Large text overflows fixed parents → review each owning scroll/keyboard layout; shared surfaces
  never claim scrolling or fixed height.
- Native settings cannot contain arbitrary RN children → adapt through chrome with native widgets.
- Automated snapshots can hide missing copy → assertions require visible message plus correct actions.
- A generic error may invent a diagnosis → use neutral operation copy unless the feature knows cause.

## Migration Plan

1. Finalize contract, spec and inventory; implement shared surfaces, tokens, announcement hook/tests.
2. Migrate import/guide surfaces and navigation, retaining prior branch fixes.
3. In parallel, migrate list/sync and form/write consumers; adapt native settings/dialogs/recovery.
4. Remove obsolete components/copy, audit all user-visible error paths against the inventory.
5. Run focused regression suites during each batch; then full coverage, typecheck, lint, React Doctor,
   spec validation, and both live Metro bundles. Use host-rendered visual previews if available.
6. Record native QA: iOS/Android, light/dark, largest fonts, keyboard, screen-reader announcement,
   QR recovery and Back, cached-content refresh failures, native validation vs server failure.

Rollback is reverting this change's presentation migrations; no data/native migration is involved.

## Platform references

- Apple alerts: https://developer.apple.com/design/human-interface-guidelines/alerts
- Apple typography: https://developer.apple.com/design/human-interface-guidelines/typography
- iOS unavailable content: https://developer.apple.com/documentation/swiftui/contentunavailableview
- RN announcements: https://reactnative.dev/docs/0.85/accessibilityinfo
- Material field: https://docs.expo.dev/versions/v56.0.0/sdk/ui/jetpack-compose/textfield/
- Android semantics: https://developer.android.com/develop/ui/compose/accessibility/semantics
- Android snackbar: https://developer.android.com/develop/ui/compose/components/snackbar

## Implementation and device handoff

The implementation uses the API above across the inventoried mobile surfaces. See [device QA](../../../docs/mobile/error-surfaces-qa.md) for representative recovery, keyboard, theme and screen-reader checks. Native rendering cannot be certified by the host component tests.
