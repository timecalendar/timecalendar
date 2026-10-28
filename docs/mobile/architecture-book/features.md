# Feature map

This page shows ownership and important dependencies. Detailed behavior belongs in
code and product specifications.

Settings owns the validated, environment-independent Day/Week/Agenda choice and default-on Show
weekends preference through `@/storage`. Calendar consumes both reactively: Day always presents
one civil date and pages through weekends, while Week presents five or seven dated columns. Only
the view choice persists; the selected date and clock offset follow fresh-open policy.

Settings also owns the native hub, theme, and language journeys. The feature supplies translated
meaning and persisted preferences to the chrome-owned SwiftUI/Material composition; About and
Environment retain typed compatibility adapters, and root i18n owns system-locale refresh.

Settings also owns the generated worldwide time-zone catalog and immutable offline search index.
Its mode screen uses native settings composition; the chooser uses Router-owned native
presentation and one `FlatList`. Exact identifiers and aliases remain selection values, while the
single effective-zone resolver continues to feed calendar, personal events, and notifications.

| Feature            | Responsibility                                                                                                                                                                                                                                                                                                                       | Persistence and external seams                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `settings`         | Theme, language, and display-timezone preferences                                                                                                                                                                                                                                                                                    | `@/storage`; consumed by theme, i18n startup, every zone-threaded rendering surface, and notification registration                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `notifications`    | Subscription preferences, one app-lifetime latest-state synchronization runtime, shared remote-save status, and notification routing                                                                                                                                                                                                 | `@/storage` keeps canonical preferences plus backend-bound dirty/generation only; current FCM token, loaded calendars, effective locale/zone, retries, and DTOs remain in memory; one generated plain PUT through `@/firebase` lifecycle inputs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `personal-events`  | Local event CRUD, validation, and feature-owned editor orchestration, field/action sections, color presets on `ColorSwatchField`, date/time field, and keyboard-safe semantic Save action                                                                                                                                                         | `@/db`; dates stored as ISO-8601 UTC text; the date/time field reaches native controls only through the shared `@/components/chrome` seam; the editor composes `KeyboardSafeActionLayout` and `Button` with no layout style                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `school-selection` | School/group queries, search, theme-aware logos, selected identities, and the neutral export-guide reference projection                                                                                                                                                                                                              | TanStack Query plus `@/storage`; nullable dark logo URLs fall back to the required default URL; the domain projection copies provider slug, Programme/Connect gates, and exact catalogue version without retaining a generated DTO                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `export-guides`    | Defensive schema-v1 catalogue parsing, ordered provider selection, exact-or-Generic resolution, immutable snapshots, native provider selection and one Stack entry per plain-text guide page titled by the page in the native header                                                                                                                                        | The generated export-guide plain operation through `customFetchResponse`; one backend-bound `@/storage` LKG registry isolated by locale, schema, and active/exact selector; `expo-image` only receives validated first-party static images (the compiled dev, preprod and production public-bucket origins) and degrades to text; journey coordination and telemetry are in-memory and privacy-allowlisted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `onboarding`       | Feature-owned welcome composition plus server-gated institution → optional Programme/Connect → mandatory export guide → manual import journey                                                                                                                                                                                        | Direct native pager selection (ADR 036); owns the Stack-scoped discriminated import journey (ADR 047), completion guards and create-field derivation; no journey progress persists; Programme uses the shared keyboard-safe layout and native Skip chrome                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `calendar-sources` | QR/iCal import, user-calendar management, and calendar rename                                                                                                                                                                                                                                                                        | `expo-camera`, generated API (incl. `PATCH /v1/calendars/{token}`), `user_calendars` table; the create seam takes its institution/programme fields explicitly                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `feedback`         | Validated suggestions and recorded iCal-failure reports                                                                                                                                                                                                                                                                              | `@/storage` for the last valid e-mail, `@/firebase` for body-free failures, generated contact API; the form composes one readable `KeyboardSafeActionLayout` with a semantic sibling filled `Button`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `calendar`         | Owned Day/Week timeline shell, agenda, sync, event details, and routing                                                                                                                                                                                                                                                              | One feature-private React Native renderer, windowed native horizontal pager and vertical owner, screen-level window store, generated sync API, and `calendar_events` table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `hidden-events`    | Hide and restore synced events; the loaded-empty management state consumes the shared illustrated full-screen state                                                                                                                                                                                                                  | One validated `@/storage` value; filtering occurs at the calendar event-source seam; stale unresolved UIDs remain omitted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `event-checklist`  | Checklist CRUD and ordering for either event kind; one UID-set live progress projection shared by event-summary screens                                                                                                                                                                                                              | `checklist_items` table; Home and Calendar/Agenda receive progress as sidecar presentation state rather than extending `CalendarEvent`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `activity`         | Device-local calendar-log cache, watermark, pagination seam, `/activity` grouped timeline, Settings unread badge, **and the single refresh/pagination seam every Activity trigger shares**                                                                                                                                           | `@/db`; reactive `useActivityLogs` / `useActivityState`; `activity_logs` / `activity_state`, merged by server log ID; `@/api/generated/calendar-logs` (`POST /v1/calendar-logs/search`, plain function, no TanStack Query, ADR 048); `findAll` from `@/features/calendar-sources/data` for held tokens + IDs — the feature's only cross-feature dependency, pointing outward so the graph stays acyclic (hidden calendars count as held); `@/firebase` records failures with static contexts and no payload. The screen calls forced newest refresh, older-page load, and cache-bounded read marking. **Activity also owns three app-lifecycle hooks (TIM-399, ADR 049):** `useActivityForegroundRefresh` (passive, only on `background → active`), `useActivityScreenRefresh` (passive on open and forced on pull-to-refresh; mounted by the screen), and `useActivityOwnershipPrune` (prunes only after an observed removal, never on the first held-calendar observation). The first and third are mounted once in `_layout.tsx` as `ActivityRuntime`. Calendar sync triggers Activity after the event write commits, and notification receipt triggers it independently beside sync; calendar-sources may not import back into it (lint B-6) |
| `home`             | Today-only dashboard and next-active-day summary                                                                                                                                                                                                                                                                                     | Reads the unified calendar event source; true-empty Up next and Today copy uses the shared left-aligned section state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `settings`         | Third-tab grouped navigation, held-calendar summary, and one capability-gated Developer row to `/developer`                                                                                                                                                                                                                          | Reads the public calendar-sources hooks; persists no state; group labels retain localized catalog casing without a forced transform                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `splash`           | Startup presentation                                                                                                                                                                                                                                                                                                                 | Presentation-only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `about`            | Localized product, privacy, contact, installed-version, and developer information                                                                                                                                                                                                                                                    | `expo-application`, `expo-web-browser`, and `expo-linking`; persists no state; one standard lane owns grouped-action width and the responsive gutter while prose uses a centered gutterless readable cap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `changelog`        | Bundled localized release history and tabs-eligible once-per-version presentation                                                                                                                                                                                                                                                    | `@/storage` integer `changelogSeenVersion`; Phase 09 imports through `setChangelogSeenVersion` before tabs mount; JS-bundle version bumps remain OTA-capable                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `environment`      | Build-authorized backend selection, the developer-page entry that is the sole environment indicator, and journaled reset/recovery. `useEnvironmentSelector` drives `EnvironmentSettingsRow`, which the developer page places in its Backend section, and `EnvironmentSelectorDialog`, which it renders after `</NativeList>` | `app.config` capability, `@/storage` journal/classification, `@/db`, Query runtime, Firebase diagnostics and injected reload                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `developer`        | Capability-gated developer page hosting the environment switch, the dev import entry (development variant only), and the component gallery (`/developer/gallery`, `/developer/gallery/[story]`)                                                                                                                                      | Persists no state; reads `@/features/environment`, `@/config/variant` and `@/design/gallery`; its capability gate (`isDeveloperSurfaceEnabled`, `access/`) is the only export of the feature barrel; links `/dev-import` and `/developer/gallery` by href                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## Design system gallery

`src/design/gallery/` holds the fixture types, the explicit registry and the story-id helpers,
exported through the developer-only `@/design/gallery` entry, never the primitive barrel `@/design`
(ADR [068](./decisions/068-design-layer-barrel-and-gallery-entry.md)). Fixtures are `*.gallery.tsx` files next to their component;
the developer feature renders them at `/developer/gallery`. A fixture meta lists its story export
names in display order (`stories`); a story that only one platform can render declares
`platforms`. Dialog stories close on Cancel and Save and reopen from a row behind them; the pending
text-entry story releases its iOS lock after three seconds so Cancel works. See ADR
[064](./decisions/064-in-house-component-gallery.md).

The registry lists, in this order (paths under `mobile/src/`):

| Fixture                                                        | Meta id                          | Stories                                                                                                                                                                                             |
| -------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design/layout/root-page.gallery.tsx`                          | `root-page`                      | `default`, `caption-only`, `scrolls-under-header`, `readable-lane`, `long-strings`                                                                                                                  |
| `design/layout/adaptive-content.gallery.tsx`                   | `adaptive-content`               | `standard-lane`, `readable-lane`, `long-strings`                                                                                                                                                    |
| `design/layout/keyboard-safe-action-layout.gallery.tsx`        | `keyboard-safe-action-layout`    | `default`, `fills-viewport`, `long-strings`                                                                                                                                                         |
| `design/text/themed-text.gallery.tsx`                          | `themed-text`                    | `ramp`, `tones`, `long-strings`                                                                                                                                                                     |
| `design/text/themed-view.gallery.tsx`                          | `themed-view`                    | `surfaces`                                                                                                                                                                                          |
| `design/icon/icon.gallery.tsx`                                 | `icon`                           | `scaling`, `glyphs` (Android)                                                                                                                                                                       |
| `design/status/status-view.gallery.tsx`                        | `status-view`                    | `loading-screen`, `loading-section`, `loading-inline`, `empty-screen`, `empty-screen-artwork`, `empty-section`, `empty-inline`, `error-screen`, `error-retry-busy`, `error-section`, `long-strings` |
| `design/status/error-surfaces.gallery.tsx`                     | `error-surfaces`                 | `notice`, `notice-compact`, `field-error`, `long-strings`                                                                                                                                           |
| `design/button/button.gallery.tsx`                             | `button`                         | `filled`, `tonal`, `outlined`, `text`, `destructive`, `icons`, `long-strings`                                                                                                                       |
| `design/button/button-row.gallery.tsx`                         | `button-row`                     | `pair`, `long-strings`                                                                                                                                                                              |
| `design/field/text-field.gallery.tsx`                          | `text-field`                     | `default`, `helper`, `error`, `disabled`, `multiline`, `keyboard`, `long-strings`                                                                                                                   |
| `design/field/date-time-field.gallery.tsx`                     | `date-time-field`                | `default`, `error`, `disabled`, `long-strings`                                                                                                                                                      |
| `design/list/list-row.gallery.tsx`                             | `list-row`                       | `plain`, `grouped`, `states`, `leading`, `static`, `overline`, `long-strings`                                                                                                                       |
| `design/list/list-section.gallery.tsx`                         | `list-section`                   | `titled`, `single`, `seam-comparison`, `long-strings`                                                                                                                                               |
| `design/list/separator.gallery.tsx`                            | `separator`                      | `insets`                                                                                                                                                                                            |
| `design/thumbnail/thumbnail.gallery.tsx`                       | `thumbnail`                      | `image`, `dark-image`, `monogram`, `sizes`                                                                                                                                                          |
| `design/badge/badge.gallery.tsx`                               | `badge`                          | `tones`, `sizes`, `with-icon`, `accessibility`, `long-strings`                                                                                                                                      |
| `design/color-dot/color-dot.gallery.tsx`                       | `color-dot`                      | `sizes`, `presets`, `rings`, `stack`                                                                                                                                                                |
| `design/event-surface/event-surface.gallery.tsx`               | `event-surface`                  | `palette`, `placements`, `increased-contrast`, `checklist`, `long-strings`                                                                                                                          |
| `components/chrome/native-list.gallery.tsx`                    | `native-list`                    | `rows`, `destructive`, `switches`, `choices`, `header-and-alert`, `radio-dialog` (Android), `long-strings`                                                             |
| `components/chrome/native-text-entry-dialog.gallery.tsx`       | `native-text-entry-dialog`       | `default`, `submit-disabled`, `pending`                                                                                                                                                             |
| `components/chrome/native-list-numeric-editor.gallery.tsx`     | `native-list-numeric-editor`     | `default`, `validation-error`, `long-strings`                                                                                                                                                       |
| `components/chrome/menu-view.gallery.tsx`                      | `menu-view`                      | `default`, `states`, `long-strings`                                                                                                                                                                 |
| `components/chrome/header-action.gallery.tsx`                  | `header-action`                  | `icons`, `text`, `both-sides`, `disabled`, `platform-only`, `long-strings`                                                                                                                          |
| `components/chrome/floating-action.gallery.tsx`                | `floating-action`                | `default`, `over-list`, `over-scroll`, `long-label`                                                                                                                                                 |
| `components/chrome/date-time-picker.gallery.tsx`               | `date-time-picker`               | `date`, `time`, `date-time` (iOS), `bounded`, `disabled` (iOS)                                                                                                                                      |
| `components/chrome/glass-surface.gallery.tsx`                  | `glass-surface`                  | `regular`, `clear`, `interactive-button`, `long-strings`                                                                                                                                            |
| `theme/tokens.gallery.tsx`                                     | `design-tokens`                  | `colors`, `contrast-pairs`, `spacing`, `radii`, `icon-sizes`, `elevation`                                                                                                                           |

- Every `long-strings` story draws the shared `gallery.stress.*` copy (a French title of at least 70
  characters, a body of at least 200, an action of at least 40 and a single 25-character word).
- Stateful fixtures hold their own state and have a colocated `*.gallery.test.tsx`: presses update a
  visible counter, dialogs close and reopen from a row behind them, menus update their trigger,
  the Android date picker writes a pick to its row, header-action stories name the last action
  pressed in the page body (each story declares its actions in its own navigation bar through
  `useHeaderActions`), floating-action stories count presses (on iOS they show an "Android only"
  caption), the text-field error story toggles its error and hint, and the Android date-time
  field commits a pick through both dialogs.
- On iOS the numeric editor story is the full-height SwiftUI form while open and a row while closed;
  on Android the Compose dialog sits over the row. The Android date picker is a row plus the
  `presentation="dialog"` picker opened on mount; iOS renders the compact inline control.
- `themed-text--ramp` lists every `TypeVariant` with the running platform's size and line height
  from `TypeRamp`; its step table `satisfies Record<TypeVariant, …>`, so a new step does not compile
  until it is listed. `design-tokens--colors` draws every `Colors` role in both schemes whatever the
  app scheme, and `design-tokens--contrast-pairs` draws `documentedContrastPairs` from
  `src/theme/contrast.ts`, the table the contrast gate asserts.
- The chrome `DateTimePicker` takes and reports device-local Dates on both platforms: a date pick
  changes the day and keeps the time of day. The Android Compose date picker speaks UTC-midnight
  days; `src/components/chrome/compose-date-day.ts` owns that conversion inside the seam
  (`date-time-picker.tsx`), and `compose-date-day.test.ts` pins it to `@expo/ui`'s
  `DatePickerView.kt` (ADR [066](./decisions/066-device-local-date-picker-seam-and-timezone-ci.md)).
  On iOS, the opt-in props `alignment="leading"` and `accessibilityLabel` render the composed
  SwiftUI picker (`date-time-picker-ios.tsx`, [theming.md](./theming.md) → chrome); Android strips
  them and renders the community component.
- `DateTimeField` is a design primitive (`src/design/field/date-time-field.tsx`): it takes the
  label, the stored instant, the display zone and a `formatValue` function from the caller and
  imports no feature and no translation key, so its fixture formats with `Intl.DateTimeFormat`
  around a fixed device-local 2030-01-02 09:30 in the device zone
  ([theming.md](./theming.md) → Fields). `error-surfaces--field-error` renders a `TextField` with
  an error; `keyboard-safe-action-layout` fixtures render `TextField`s.
- `button-row--*` captions name the active layout (side by side or stacked),
  `status-view--long-strings` names whether its artwork is shown at the current text size, and
  `text-field--long-strings` and `date-time-field--long-strings` name whether the accessibility
  text size is active; the gallery never
  forces a font scale, so the reviewer sets the device text size. `icon--glyphs` renders every
  `MATERIAL_GLYPHS` key with its name.

## Responsive presentation ownership

- `activity` and `hidden-events` use `RootPage` with a measured standard lane. Their list/scroll
  owners, loading/error distinctions, pagination, filtering, and write behavior remain
  feature-owned; loaded-empty presentation is a `section` `StatusView` with local artwork.
  Activity's first load is a `screen` loading `StatusView` in the lane (`activity-loading`) and
  its older-page footer an `inline` one (`activity-older-loading`).
- `personal-events` uses a standard `RootPage` for its standalone list and a readable page for the
  editor, while giving list/create/edit titles to compact native Stack chrome. The list's empty
  state is a title and caption ("No personal events", "Events you add appear here."). The
  editor's fields scroll independently while the shared keyboard owner pins the readable-lane
  Save/Delete region. The editor passes `KeyboardSafeActionLayout` no layout style: Save and
  Delete are stacked full width, Save first, in the shared action rhythm (8 pt apart, 12 pt above,
  16 pt below).
  On Android the date/time field opens the native date dialog, then the native time dialog; the
  two commit together as one display-zone wall clock. The time dialog follows the device
  12/24-hour setting. Cancelling either dialog, or a dialog confirming an invalid or epoch date,
  leaves the value unchanged. The form's title, location and description are `TextField`s and its
  Starts and Ends are the design `DateTimeField` (`src/design/field/date-time-field.test.tsx`,
  `ui/wall-clock-day.test.ts`); the range error sits under Ends. The field's accessible name is
  "label, value", because TalkBack reads the button's content description instead of its child
  text. The Delete label uses `destructive`.
  The field text, its accessible name and the list ranges follow the device 12/24-hour setting
  through `formatShortDateTime(…, uses24HourClock)`, read once per screen with the calendar data
  hook `useUses24HourClock` (`src/hooks/`, re-exported by `@/features/calendar/data`); the form
  passes the formatter to `DateTimeField` and the list passes it to its rows. The iOS picker takes
  no `locale` and follows the device language and clock (`src/design/field/date-time-field.test.tsx`); an app language that
  differs from the device language is a known parity gap
  (`docs/react-native-migration/inbox/2026-10-25-mobile-ios-picker-device-language.md`). The color is a `ColorSwatchField`
  over the feature's `SWATCH_PRESETS`; its swatches announce translated names
  (`SWATCH_NAME_KEYS`) as radios on Android and selected buttons on iOS
  (`src/design/field/color-swatch-field.test.tsx`, `ui/personal-event-form-screen.test.tsx`).
- Status UI is `StatusView` (ADR [069](./decisions/069-status-view.md)). School selection: the
  school picker's loading, no-results (`announcementKey="noResults"`, missing-school text action),
  empty and error states and the group picker's loading, empty and error states are `section`
  presentations under the search/list chrome. Export guides: the guide loading and blocking-error
  pages are `screen` presentations in a readable `RootPage` (retry busy while refetching, Back
  secondary) under the localized guide title; a shown guide page puts its own title in the native
  header and focuses a progress caption named "<page title>, Page n of N". Provider selection shows
  a caption and no in-content heading. Guide images load only from the compiled first-party
  origins (`EXPORT_GUIDE_ASSET_ORIGINS`: the dev, preprod and production public buckets,
  `data/parser.test.ts`). Calendar sources: import progress, import-result failure and QR failure are
  `screen` presentations; the user-calendars empty state is a `screen` direct `RootPage` child,
  mounted only once the list has loaded. Calendar event details: loading is `screen` loading,
  not-found a `screen` empty with the `calendar.badge.exclamationmark` / `event_busy` symbol.
  Settings timezone chooser: no results is the `FlatList` `ListEmptyComponent`, a `section` empty
  with `announcementKey="noResults"` (`timezone-no-results`). Home sections use `inline`;
  personal events, hidden events and Activity empties use `section`; Activity's first load is
  `screen` and its older-page footer `inline`. The developer import and the environment runtime
  gate keep their own spinners until their slices
  ([lint-format.md](./lint-format.md) → Status).
- Lists the native seam cannot host render `ListRow` (ADR
  [073](./decisions/073-list-row-family.md), [theming.md](./theming.md) → Lists), each keeping
  its testIDs: the Settings timezone chooser (plain rows with a check on the active zone and
  `ListRowSeparator`), the school picker (plain rows led by a medium `Thumbnail` with the school
  monogram as fallback and an inset `ListRowSeparator`; the row's name stays the bare school name), hidden events (a
  `ListSection` per group of static rows with the Unhide button as accessory), Activity (grouped
  rows with a toned overline under a `ListSectionHeader` per server log, the calendar name as
  title and the change time as detail, one heading named "calendar, changed time"; new and
  changed rows open event details and announce their change lines, cancelled rows are static), personal events (grouped rows with a large `ColorDot` in the
  event color as leading element, the row named by the title alone, opened through `router.push`) and export-guide provider selection (grouped rows led by a large
  `Thumbnail`). The dormant school-group picker renders one `ListSection` per tree level: leaves
  are `selected` toggles, branches are `expanded` disclosure rows whose children open a section
  titled by the branch, and Confirm is a filled `Button`.
- Home's welcome card summarizes the day with at most five overlapping medium `ColorDot`s ringed
  in `homeHero`, then a `+N` count, in a container hidden from assistive technology; the summary
  text carries the count (`ui/home-screen.test.tsx`).
- Event tiles are `EventSurface` ([theming.md](./theming.md) → Event tiles, ADR
  [076](./decisions/076-event-surface.md)): the Home upcoming card (`upcoming-card-<id>`, flow,
  regular), the Home all-day item (in `home-all-day`, flow, compact), the Home today-timeline tile
  (`today-tile-<id>`, absolute at the overlap engine's geometry; flow in the large-text
  `today-timeline-list`) and the agenda tile (`agenda-event-<id>[-progress-<c>-<t>]`, flow,
  regular, no shadow, the brand now marker outside the tile). Each keeps its testID and its label
  builder (`homeEventOpenLabel`, the agenda `calendar.agenda.event.openLabel*` keys)
  (`ui/home-screen.test.tsx`, `ui/today-timeline.test.tsx`, `calendar/ui/calendar-screen.test.tsx`).
- The inline checklist progress pill (Home today, upcoming and timeline cards, the agenda) is a
  hidden `Badge` with the checked or pending glyph and `completed/total`; the owning summary
  carries the progress phrase. On an `EventSurface` it is tone `onEventSurface` and the `compact`
  pill draws in the surface foreground; elsewhere (the week grid) the pills are `positive` when
  complete and `informational` otherwise. The `compact` variant fitted inside calendar grid tiles
  keeps its own drawing (`event-checklists/ui/checklist-progress-indicator.test.tsx`).
- Home's brand lockup renders the app name as a one-line `title2` header capped at
  `WordmarkMaxFontScale` (`ui/home-screen.test.tsx`).
- `onboarding/index` keeps its branded safe-area composition. Each welcome page wraps its content
  in a vertical ScrollView that centers when the content fits and scrolls when it does not; at
  accessibility text sizes the illustration takes half its height, page titles cap at
  `WordmarkMaxFontScale`, and no title, body, Skip or Next label sets a one-line cap or
  shrink-to-fit, so every label wraps. Skip, Next and the final CTA are `Button`s; the Skip bar is
  at least `MinTouchTarget + Spacing.three` tall and grows with Skip; the page indicator reserves
  `MinTouchTarget`; the entrance fade and indicator transition take `Motion.base` and `Motion.fast`
  and snap under reduced motion; body copy uses the `secondary` tone (`ui/welcome-screen.test.tsx`).
  On iOS, a Dynamic Type change made while the app runs leaves React Native text frames at the
  previous size until relaunch, app-wide (inbox
  `2026-10-26-ios-runtime-dynamic-type-stale-text-layout.md`); a cold launch lays the welcome
  pages out correctly at every size. Every ordinary pushed child uses
  compact native chrome and one shared page frame; form screens retain their keyboard/scroll owners,
  School retains its virtualized list and native search, and QR retains its full-bleed camera below
  the header. These presentation bounds do not change step order, validation, or routing.
- Feedback, institution name, Programme and iCal URL use render-function `RootPage` surfaces around
  one readable keyboard-safe owner and pass it no layout style: the three onboarding-journey steps
  use `contentPlacement="center"`, and Feedback keeps only its own scroll-body composition. Their fields are `TextField`s (Feedback's email moves focus to the message
  on Next through the field `ref`; both are disabled while sending; the institution-name step uses
  the same field) and stay with their validation in the sole scroll body; their semantic
  filled action is a measured sibling. Programme Skip is a right header text action on both
  platforms (`useHeaderActions`, `onboarding-programme-skip`).
- `school-selection` lays its list edge to edge (full-bleed lane) like a native plain list: rows
  carry their own horizontal padding and iOS separators inset to the row text. From calendar
  management the picker opens as the first screen of the nested onboarding Stack: Android's native
  back walks up to the parent Stack, while UIKit shows no back there, so iOS alone adds a left
  header action Back (`useHeaderActions`, `platform: "ios"`, `onboarding-school-back`) that
  dismisses the onboarding Stack.
- Header actions and floating actions come from `useHeaderActions` and `FloatingAction`
  ([theming.md](./theming.md) → Header and floating actions, ADR [075](./decisions/075-header-and-floating-actions.md)):
  - Calendar: right Today (`calendar-today`, when the view can jump to today) and, on iOS, Add
    (`calendar-add`); Android adds through a `FloatingAction` (`calendar-fab`), and the Android
    agenda pads its bottom by `Layout.fabClearance`. Both adds are labelled "Add an event". The
    view menu stays a hand-built `headerLeft` (5.10, the header-action allowlist entry).
  - Personal events: on iOS a right Add (`plus`, `personal-events-add`); Android adds through a
    `FloatingAction` with the same testID, and the list pads by `Layout.fabClearance`. Both are
    labelled "Add event".
  - Home: an Android `FloatingAction` (`home-add-personal-event`) over the scroll, which pads by
    `Layout.fabClearance`; iOS keeps its in-content glass "+" (5.9).
  - Event details: the right text action Edit, Hide or Un-hide (`event-details-action`).
  - Changelog sheet: the right text action Close with its hint (`changelog-close`).
  - Timezone chooser: on iOS without the bottom search toolbar, a left text action Close
    (`timezone-close`); the iOS 26 bottom toolbar stays a `Stack.Toolbar placement="bottom"`.
  - User calendars, Programme and the school picker: below.
- Calendar event details center the decorative color dot on the first title line through a
  hidden `title`-step strut (`ui/event-details-screen.test.tsx`).
- `calendar-sources` keeps the QR camera full bleed and bounds permission, viewfinder, guidance,
  import, and recovery content with readable lanes. iCal form and state content is readable; the
  iCal URL is a `TextField` (`ical-url-input`);
  user-calendar collection content is standard; its first-content inset belongs to the populated
  list so it scrolls beneath native chrome. Rename uses the product-neutral controlled native dialog
  seam from ADR [056](./decisions/056-compose-native-dialog-behind-chrome.md): SwiftUI on iOS and
  Material 3 on Android own the field/actions while calendar validation and persistence stay in the
  feature. Source behavior and permission lifecycle remain unchanged.

## Cross-feature contracts

- Activity's repository, cache, unread, trigger, and navigation ownership above is implemented but
  not production-approved. The candidate-bound
  [release-readiness record](../../react-native-migration/05-tech-specs/activity-release-readiness.md)
  remains fail-closed until every frozen capacity, compatibility, privacy, and native row passes.
- The calendar event-source seam merges synced and personal events, applies calendar
  visibility and hidden-event filters, and supplies Home, Calendar, and event details.
- Calendar taps open unified event details for both event kinds. Personal events can
  continue to the edit form; synced events remain read-only.
- The design `DateTimeField` used by the personal-event form hands the chrome `DateTimePicker`
  the display zone's wall clock as a device-local Date and converts the pick back with `fromZonedTime`; the seam owns
  the Android day conversion, the field owns the display-zone conversion.
- Home and Calendar each own one rendered-UID-set checklist-progress subscription.
  Summary components receive the resulting map; they never query SQLite per event.
- User-calendar rows contain server calendar IDs and durable source tokens. Notification
  registration sends server IDs, not tokens.
- User-calendar management is two native-list pages. `/user-calendars` lists every held
  calendar in one section as a navigation row: effective name, school (or the personal subtitle),
  and a Shown/Hidden value, with the section footer explaining what a calendar page controls. The
  add action is an iOS header action and, on Android, a `FloatingAction`, both `user-calendars-add`;
  the load-gated empty state keeps the FAB. `/user-calendars/[id]` is the calendar's page, titled with its name: a Name
  row opening the rename dialog, the school when present, the labelled "Show in Home and Calendar"
  switch with a footer that says what hiding does, and a destructive Delete row. The explicit
  switch label and footer exist because an unlabelled toggle did not tell students what it
  controlled. Write failures render as the page's first `NativeListAlert`.
- Visibility writes are coordinated at page scope by calendar-ID-keyed optimistic operations over
  the whole held-calendar read, so a calendar briefly missing from the read cannot discard them. Each calendar permits one
  unresolved write at a time. A successful target remains visible until the reactive read
  acknowledges it; failure reveals the latest canonical value, acknowledgement retires the
  operation synchronously, and later canonical changes render without a stale optimistic mask.
  This presentation state does not change the event-source visibility filter in `calendar`.
- Delete is confirm-gated by a native destructive Alert; success announces the deletion and pops
  back to the list, failure keeps the page and its alert.
- Rename is a server write first: it PATCHes the token, then persists the name the **server
  returned**, never the string the user typed, so the renaming device
  converges through the same rule every other device reaches at its next sync. The token is
  a capability — possession authorizes rename — so a rename is global to every installation
  holding it (ADR [050](./decisions/050-token-authorized-shared-calendar-rename.md)).
- Calendar names converge on the sync path: after the event replace, sync writes back the
  returned names through the narrow `updateName(id, name)` write. It must never `upsert` a
  `user_calendars` row and never route through `fromCalendarForPublic`, which hard-codes
  `visible: true` — a full-row write would silently unhide a calendar the student hid, on
  every sync, i.e. at every app start. Nothing in lint or types can catch that, which is why
  it is written here (ADR
  [052](./decisions/052-eventual-calendar-name-convergence-through-sync.md)).
- The event replace and the name write-back are two failure domains, not one. A failed name
  write keeps the replaced events committed and the last-good names in place, records under
  its own context, and leaves convergence to the next sync.
- Every calendar-name label goes through `effectiveCalendarName(stored, fallback)`:
  `trim(stored)` when non-empty, else the localized "My timetable" / "Mon emploi du temps".
  An empty or whitespace-only name is legal and is a display substitution only — the stored
  value is never rewritten, and an over-long stored name still displays in full. "Every" is
  literal and includes the event-details calendar label, not only the user-calendar list and
  the rename dialog.
- Feedback sends every held calendar's server ID. Calendar sources may open Feedback
  after a recorded iCal import failure with only the attempted URL, the draft's institution
  ID **or** name, and the normalized programme name as `calendarName` — each omitted when
  empty. `gradeName` is never sent. Local invalid-URL errors never offer reporting.
- The import journey hands its institution and programme to calendar creation through one pure
  derivation (`toCreateFields`), and the create seam receives those fields as a parameter — it
  never reads the draft. Exactly one of `schoolId` / `schoolName` reaches the server, because the
  server validates them as a mutually exclusive pair. Manual, QR, and iCal creation stay disabled
  until ADR 047's in-memory completion and guarded handoff checks succeed; an empty draft is a
  recovery value, never create authorization.
- A valid QR import stays synchronously excluded from later camera callbacks while its shared
  create operation is pending or failed. Failure preserves the captured normalized URL and the
  Stack-scoped draft for an explicit retry; only **Scan another QR** clears that attempt and
  re-arms the camera. The alternate manual-iCal action pushes the existing sibling route without
  putting the private QR URL in navigation parameters. Late promise settlement after unmount has
  no navigation, draft, recording, or state effect.
- Feedback treats contact-service 503 responses as recoverable: the form retains the
  e-mail and message, re-enables explicit retry, announces equivalent FR/EN guidance,
  and records only the error plus the static `feedback/contact-submit` context. The
  shared API mutator never prints contact request or response bodies in development.
- Notification receipt always requests a calendar sync. Only notification taps navigate.
- Notification subscription PUTs have one root owner. Preference, token, loaded-calendar revision,
  effective locale/zone, startup, foreground, and manual Retry all invalidate that owner; screen
  hooks only expose local preferences and its shared status. A current generation and runtime epoch
  must match before acknowledgment can clear durable dirty intent.
- Notification UI keeps frequency and horizon editable and retained while subscription intent is
  off. Presets are 1, 3, 7, 14, and 30 days; other valid stored values remain Custom. Custom uses a
  fresh local draft, exact digit-only 1–30 validation, and one explicit Done/Save commit. Cancel,
  Back, swipe dismissal, opening a choice, and invalid submission never write. Chrome owns the
  SwiftUI/Compose primitives and native buffers; the feature owns options, localized validation,
  commit policy, and the reusable presentation of the shared route-independent sync status.
  The page is three sections (subscription, frequency, days ahead), each with its help text as the
  section footer. Sync status appears only on failure, as the first element with Retry. Waiting for
  a push token or loaded calendars is transient runtime plumbing, not something the user can act
  on (notification permission is requested separately and does not gate the token), so it stays
  hidden like pending and acknowledged.
- Local preference parsers are total: absent, corrupt, or legacy values return safe
  defaults instead of throwing.
- UI failures are accessible. Unexpected native, persistence, and background failures are
  recorded through `@/firebase` without personal data.
- About owns its standalone `features/about` module and renders the `NativeList` seam directly
  (`NativeListSection`, `NativeListRow`). It opens with the chrome brand header (app icon, name, blurb, and the version caption as a brand `Badge` with testID `about-version`); a
  link failure shows as a `NativeListAlert` below it. This reversible local ownership choice does not require an ADR.
- Changelog owns its typed newest-first catalog, total seen-version store, gate, and shared
  history/sheet content. The content is a `ListSection` per release titled "Version x"
  (`changelog-release-<version>`) with a static `ListRow` per item: the catalog icon as leading
  icon, the title as label and the description as subtitle
  (`changelog-release-<version>-item-<index>`). Phase 09 must call its exported setter before `(tabs)` mounts; every
  future `CHANGELOG_VERSION` bump must ship matching bundled content in the same JS update.
- Environment switching owns all destructive coordination. Feature UI never clears SQLite/MMKV
  directly. Any future authentication/session feature must register its idempotent clear operation
  with the environment participant registry before shipping (ADR 043).

The user-calendar module split, list virtualization, and optimistic controller are reversible
implementation structure. They do not change storage, filtering, public interfaces, dependencies,
or product behavior, so they require no additional ADR.

## Navigation

The root contains Home, Calendar, and Settings tabs. Settings, notification settings,
personal events, event details, calendar-source management, About, and onboarding are stack
routes outside the tab group. Settings owns a nested native Stack and a thin feature UI
entrypoint. `/about` is a root Stack sibling reached from Settings; `/settings` is canonical,
and root `/profile` temporarily redirects to it.

See [calendar.md](./calendar.md), [storage.md](./storage.md), and
[golden-path.md](./golden-path.md) for shared implementation contracts.
