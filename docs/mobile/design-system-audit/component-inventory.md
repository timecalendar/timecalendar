# Mobile component inventory

Date: 2026-10-25. Scope: Phase 0 design-system audit of the UI layer of `mobile/` (Expo SDK 56, RN 0.85, Expo Router). This file is a read-only inventory; no app code was changed.

## Method

- Component definitions were found with `grep` for `function [A-Z]…` / `export const [A-Z]… = forwardRef` in non-test `.tsx` files under `mobile/src/components/`, `mobile/src/features/*/ui/`, and `mobile/src/features/calendar/renderer/`. Each file with a load-bearing API was then read.
- **Consumers** = distinct non-test files, other than the defining file and `index.ts` barrels, that reference the export name as a whole word. Matches that were only comments or same-named types were checked by hand and removed (for example `ExportGuideImage` the data type, `NotificationSyncStatus` the data type, `GridLine`/`HourLabel` in the calendar renderer, which are separate local functions). "Private" means the component is not exported and is only used in its own file.
- **Platform** lists `Platform.OS` / `Platform.select` line numbers in the file. No `.ios.tsx` / `.android.tsx` sibling files exist anywhere in `mobile/src`. Platform splits are done in code or with `-ios` / `-android` file names (only `native-text-entry-dialog-*`).
- **Tests** = colocated `*.test.tsx` and its number of `it`/`test` cases, with the test titles summarized. "Indirect" means there is no colocated test, but a parent screen test renders the component.
- **A11y** counts are per file (from `grep -c`) for `accessibilityRole` (role), `accessibilityLabel` (label), `accessibilityState` (state), `accessibilityLiveRegion` (live), `accessibilityHint` (hint), `accessible`, `importantForAccessibility` (ifa), `accessibilityElementsHidden` (hidden), and `testID`. Native `@expo/ui` modifiers (`accessibilityLabel(...)`, `accessibilityIdentifier(...)`) are counted in the same way.
- **Tokens**: "theme" means the file imports `useTheme` and/or `Spacing`/`Radii` from `@/theme`. "hard" flags literal `fontSize`, hex/rgba colors, or fixed layout numbers.

Totals: **212 React components** are defined. That is 50 in `src/components` (28 exported, 22 private platform/internal parts), 141 in `src/features/*/ui` (106 exported), 18 in `src/features/calendar/renderer` (6 exported), and 3 render-null runtime components elsewhere. 5 more modules in `src/components` are non-component helpers (style/option builders, icon map, re-exports).

---

## Shared components (src/components)

| Component | Def | Purpose | Props / variants | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ThemedText` | `mobile/src/components/themed-text.tsx:17` | Themed `Text` with the type scale | `TextProps` + `type?: "default"\|"title"\|"small"\|"smallBold"\|"subtitle"\|"caption"\|"captionSmall"`, `themeColor?: ThemeColor`. `title`/`subtitle` set `accessibilityRole="header"` | 57 (52 feature/renderer files + 5 in `components/`) | none | `themed-text.test.tsx`, 4: renders children, title/subtitle are headings, default isn't, caller role wins | role 1 | theme color; **hard** type scale (7 literal `fontSize`, lines 46-84) |
| `ThemedView` | `mobile/src/components/themed-view.tsx:9` | `View` with themed background | `ViewProps` + `type?: ThemeColor` (default `background`) | 6: home-screen, calendar-screen, school-picker-screen, dev-import-screen, qr-import-views, welcome-screen | none | **none** | none | theme |
| `PrimaryAction` | `mobile/src/components/primary-action.tsx:23` | Filled brand button with busy spinner | `label`, `accessibilityLabel?`, `onPress`, `testID?`, `disabled?`, `busy?`, `style?`. One visual variant | 8: error-surfaces, guide-page-screen, feedback-screen, ical-url-screen, personal-event-actions, institution-name-screen, calendar-import-result-screen, programme-screen | 49, 53 (44 vs 48 min height, iOS-only press opacity) | `primary-action.test.tsx`, 4: brand pair, custom label, dark mode, busy inside one button | role, label, state `{disabled,busy}`, hidden spinner, testID | theme (`Radii`, `Spacing`, `primaryStrong`, `onPrimary`) |
| `RootPage` | `mobile/src/components/root-page.tsx:24` | Page root: SafeArea, background, header inset, adaptive lane | `children: ReactNode \| (layout) => ReactNode`, `lane?: ResponsiveLane` (default `standard`), `testID?`, `style?`, `contentContainerStyle?`, `scrollsUnderHeader?` | 23 feature files | via `useHeaderOverlapInset` (iOS only) | `root-page.test.tsx`, 7: virtualized owner, iOS header pad, self-insetting scroll, empty scroller, PageIntro composition | testID (+`-lane`) | theme |
| `PageIntro` | `mobile/src/components/root-page.tsx:71` | Title + caption intro block | `title?`, `caption?`, `testID?`, `style?`. Returns null if both are missing | 9: provider-selection, feedback, school-picker, ical-url, institution-name, manual-import, qr-permission-views, programme, connect | none | in `root-page.test.tsx` (2 cases) | title via `ThemedText` heading | theme |
| `AdaptiveContent` (+ `useAdaptiveLayout`) | `mobile/src/components/adaptive-content.tsx:56` (hook :23) | View that measures its owner and applies a responsive lane | `ViewProps` + `lane: ResponsiveLane`, `contentContainerStyle?` | component 3: qr-import-views, welcome-controls, welcome-pages. Hook 5: root-page, keyboard-safe-action-layout, adaptive-content, home-screen, calendar-agenda-pane | none | `adaptive-content.test.tsx`, 4: compact lane before measure, nested owner, invalid measurements, caller onLayout | none | theme (`resolveResponsiveLayout`) |
| `KeyboardSafeActionLayout` | `mobile/src/components/keyboard-safe-action-layout.tsx:36` | Scroll body + sticky action region that avoids the keyboard | `children`, `actions: ReactNode`, `lane?` (default `readable`), `testID?`, `contentTestID?`, `actionsTestID?`, `contentContainerStyle?`, `actionContainerStyle?`, `scrollsUnderHeader?` (default true) | 5: feedback-screen, ical-url-screen, personal-event-editor, programme-screen, institution-name-screen | 54, 68 (offset/behavior via `keyboard-avoiding-behavior.ts`) | `keyboard-safe-action-layout.test.tsx`, 3: content before action, header inset, viewport-filling content | testID x3 | theme (`Spacing`) |
| `EmptyState` | `mobile/src/components/empty-state.tsx:22` | Illustrated empty message | `variant: "screen"\|"section"`, `title`, `caption?`, `artwork?: {light,dark}`, `testID?`, `style?` | 6: today-section, upcoming-section, activity-screen, personal-events-list, hidden-events-screen, user-calendars-screen | none (scheme only) | `empty-state.test.tsx`, 1 `it.each` over both variants | role `text`, live `polite`, hidden artwork | `Spacing` only, no `useTheme` |
| `ErrorMessage` (private) | `mobile/src/components/error-surfaces.tsx:32` | Announced alert text (optional title) | `title?`, `message` | private (ErrorNotice, ErrorState) | 44 (Android-only live region) | indirect | role `alert`, accessible, live | **hard** title `fontSize: 20` (line ~200) |
| `FieldError` | `mobile/src/components/error-surfaces.tsx:56` | Inline field validation error | `message`, `nativeID?`, `testID?`, `style?` | 6: feedback-screen, school-group-picker-screen, ical-url-screen, personal-event-fields, institution-name-screen, programme-screen | 72 | `error-surfaces.test.tsx` | role `alert`, live (Android) | theme (`error`) |
| `ErrorTextAction` | `mobile/src/components/error-surfaces.tsx:81` | Quiet text-style action/link button | `ErrorAction` (`label`, `onPress`, `accessibilityLabel?`, `testID?`, `disabled?`, `busy?`) + `role?: "button"\|"link"`, `style?` | **0 external** (used by ErrorNotice/ErrorState in the same file) | 106, 107 | `error-surfaces.test.tsx` (busy/disabled `it.each`, report link) | role, label, state, hidden spinner | theme |
| `ErrorNotice` | `mobile/src/components/error-surfaces.tsx:130` | Inline error card with one recovery action | `message`, `title?`, `action?: ErrorAction & {role?}`, `compact?`, `testID?`, `style?` | 14 feature files | via children | `error-surfaces.test.tsx` | via ErrorMessage | theme |
| `ErrorState` | `mobile/src/components/error-surfaces.tsx:162` | Full-page error: icon, message, primary + secondary | `title`, `message`, `primaryAction?`, `secondaryAction?`, `testID?`, `style?` | 7: guide-status, school-group-picker, activity-screen, school-picker, environment-runtime-gate, calendar-import-result-screen, qr-import-views | via children | `error-surfaces.test.tsx`, 6 total: field-error announce, native host announce, notice/action split, full error, busy/disabled, link, long text dark | hidden SymbolView | theme |
| `AppTabs` | `mobile/src/components/app-tabs.tsx:5` | Root tab bar: Home / Calendar / Settings | none | 1: `app/(tabs)/_layout.tsx` | none (SF/MD icon names) | `app-tabs.test.tsx`, 4: order, i18n labels, settings symbol, calendar reselect | none | via NativeTabs |

Non-component helpers in `src/components`:

- `headerScrollProps(scrollsUnderHeader)`, `mobile/src/components/header-scroll-props.ts:4`: scroll props paired with `RootPage.scrollsUnderHeader`. 5 consumers: activity-screen, personal-events-list, hidden-events-screen, qr-import-views, keyboard-safe-action-layout. Not tested on its own.
- `resolveKeyboardAvoidingBehavior` / `resolveKeyboardVerticalOffset`, `mobile/src/components/keyboard-avoiding-behavior.ts:3,12`: used only by `KeyboardSafeActionLayout`.
- `useErrorAnnouncement`, `mobile/src/components/use-error-announcement.ts:5`: iOS `announceForAccessibilityWithOptions`, Android only when `native`. Consumers: error-surfaces, native-settings, native-error-notice.
- `noDataArtwork` / `developerActivityArtwork`, `mobile/src/components/empty-state-artwork.ts:3,8`: hidden-events-screen and activity-screen.

### Chrome seam (src/components/chrome)

The barrel `mobile/src/components/chrome/index.ts` is the only allowed import site for the alpha native-chrome packages (lint boundary). It exports:

- **Public:** `GlassSurface`, `NativeTabs`, `NativeTextEntryDialog` (+ `NativeTextEntryDialogIds`/`Props` types), `buildCompactRootScreenOptions`, `useHeaderOverlapInset`, `DateTimePicker`, `Host`, `MenuView`, `MenuComponentRef` (type), `Picker`, `NativeErrorNotice`, `NativeSettingsAlert`, `NativeSettingsChoiceRow`, `NativeSettingsFloatingAction`, `NativeSettingsHost`, `NativeSettingsRadioDialog`, `NativeSettingsRow` (+ `NativeSettingsRowProps`), `NativeSettingsSection`, `NativeSettingsSwitchRow`, `NativeSettingsHeader`, the `NativeSettingsIcon` type, `NativeSettingsNumericEditor` (+ Ids/Props types).
- **Private (module-internal):** `NativeTextEntryDialogIos`, `NativeTextEntryDialogAndroid`, `IosNumericEditor`, `AndroidNumericEditor`, `HeaderContent`, `materialSymbolSource`, and every `Swift*`/`Compose*` part in `native-settings.tsx`.

| Component | Def | Purpose | Props / variants | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `NativeTabs` (`ThemedNativeTabs` + `.Trigger`) | `mobile/src/components/chrome/native-tabs.tsx:27` (export :48) | Themed wrapper over `expo-router/unstable-native-tabs` | all `NativeTabs` props, caller overrides the injected colors | 1: app-tabs | 34 (Android-only `backgroundColor`) | **none** (covered by `app-tabs.test.tsx`) | none | theme |
| `GlassSurface` | `mobile/src/components/chrome/glass-surface.tsx:18` | Liquid-glass view, plain `View` fallback | `GlassViewProps` | 1: home-screen-header | runtime `isLiquidGlassAvailable()`, not `Platform` | **none** | none | none |
| `expo-ui` re-exports | `mobile/src/components/chrome/expo-ui.tsx` (export line ~41) | `Host`, `Picker`, `DateTimePicker`, `MenuView`, `MenuComponentRef` | upstream | `DateTimePicker` 1 (date-time-field). `MenuView`/`MenuComponentRef` 1 (calendar-view-menu). **`Host` 0, `Picker` 0** | n/a | n/a | n/a | n/a |
| `buildCompactRootScreenOptions` / `useHeaderOverlapInset` | `mobile/src/components/chrome/root-screen-options.ts:30,54` | Stack header options (iOS transparent + blur by OS version, Android opaque) and the iOS header inset | `{background, text}` / none | builder 2: `app/_layout.tsx`, `app/onboarding/_layout.tsx`. Hook 1: root-page | 25 (`Platform.Version`), 34, 56 | `root-screen-options.test.tsx`, 4: per-scheme options, iOS header height, 0 outside header, 0 on Android | n/a | colors passed in |
| `NativeErrorNotice` | `mobile/src/components/chrome/native-error-notice.tsx:16` | Error title/message as SwiftUI/Compose text inside an existing native host | `title?`, `message`, `testID` | 3, all inside chrome: text-entry-dialog-ios/-android, numeric-editor. **0 feature consumers** although exported | 29 | `native-error-notice.test.tsx`, 1: shows title/message, announces a changed failure once | native identifier; announcement via `useErrorAnnouncement({native:true})` | theme (`error`) |
| `NativeSettingsHeader` | `mobile/src/components/chrome/native-settings-header.tsx:83` | App-icon brand header row inside a settings form | `title`, `tagline`, `detail?`, `caption?`, `testID`, `captionTestID?` | 2: about-screen, settings-gallery-screen | 55, 85 | `native-settings-header.test.tsx`, 2: full content, optional detail/caption omitted | icon `accessible={false}`, heading via `ThemedText type="subtitle"` | theme + **hard** `ICON_SIZE 88`, `MAX_WIDTH 560`, margins 20/16, 4 literal `fontSize` |
| `HeaderContent` (private) | `mobile/src/components/chrome/native-settings-header.tsx:38` | RN content hosted in the native row | header props + `width` | private | 55 | indirect | see above | see above |
| `NativeSettingsNumericEditor` | `mobile/src/components/chrome/native-settings-numeric-editor.tsx:174` | Native numeric-entry form with cancel/submit | `title`, `label`, `initialValue`, `cancelLabel`, `submitLabel`, `validationMessage?`, `ids: {container,field,cancel,submit,message}`, `onCancel`, `onSubmit(value)` | 2: notification-days-custom-screen, notification-settings-screen | 177 (picks the iOS/Android part) | `native-settings-numeric-editor.test.tsx`, 2: one form + numeric keyboard + buffer; inert outside taps, Back cancels | label x2, testID x7 | theme |
| `IosNumericEditor` / `AndroidNumericEditor` (private) | `…/native-settings-numeric-editor.tsx:61`, `:109` | SwiftUI `Form`+`TextField` / Compose dialog | same props | private | per platform | indirect | as above | theme |
| `NativeTextEntryDialog` | `mobile/src/components/chrome/native-text-entry-dialog.tsx:31` | Platform text-entry dialog (iOS bottom sheet, Android M3 AlertDialog) | `title`, `initialValue`, `label`, `placeholder`, `message: string\|null`, `messageKind?: "validation"\|"operation"`, `cancelLabel`, `submitLabel`, `pending`, `submitDisabled`, `ids: {dialog,input,message,cancel,submit}`, `onChange`, `onSubmit(current)`, `onCancel` | 1: rename-calendar-dialog | 32 | `native-text-entry-dialog.test.tsx`, 8: non-dismissible while saving, swipe cancel, keyboard submit gating, buffer kept across busy/error, selectors, M3 dismissal/IME, validation-only invalid state, Compose buffer | see parts | n/a |
| `NativeTextEntryDialogIos` (private by convention, exported from file) | `mobile/src/components/chrome/native-text-entry-dialog-ios.tsx:40` | SwiftUI `BottomSheet` + `Form`/`TextField`/`ProgressView` | same props | 1 (dispatcher) | file-level split | indirect via dispatcher test | label x3, testID x4 | theme |
| `NativeTextEntryDialogAndroid` (same) | `mobile/src/components/chrome/native-text-entry-dialog-android.tsx:21` | Compose `AlertDialog` + `OutlinedTextField` + `CircularProgressIndicator` | same props | 1 (dispatcher) | file-level split | indirect | testID x10 (Compose `testID` modifier) | none (Material palette) |
| `native-settings-icons.ts` | `mobile/src/components/chrome/native-settings-icons.ts:36` | `NativeSettingsIcon = {ios: SFSymbol, android: MaterialSymbol}` + a 16-entry bundled Material XML map | type + `materialSymbolSource(name)` | type used by settings-row and the native-settings parts | n/a | none | n/a | n/a |

#### native-settings.tsx (exported parts)

`mobile/src/components/chrome/native-settings.tsx`: iOS renders SwiftUI (`Form`/`Section`/`Button`/`LabeledContent`/`Toggle`). Android renders Compose (`LazyColumn` of M3 `ListItem`s in rounded segment groups through `SegmentContext`). Fixed layout numbers live in the file (`OUTER_RADIUS 20`, `INNER_RADIUS 4`, `SEGMENT_GAP 2`, `LIST_INSET 16`, `LIST_BOTTOM_PADDING 24`, `FAB_CLEARANCE 88`, lines 168-173). Colors come from `useTheme()` (`tint(theme.primary)`, `seedColor`) and the Material palette. Test: `native-settings.test.tsx`, 15 cases (iOS: scheme, one scroll surface, brand tint, icons/footers, alert with/without action, choice checkmark, subtitle + destructive, no FAB. Android: brand seed, segment grouping + text roles, error-container alert, 56dp radio dialog, hidden dialog, supporting/trailing text + destructive, FAB + list clearance, default padding).

| Part | Def | Props | Variants / states | Platform | Consumers |
| --- | --- | --- | --- | --- | --- |
| `NativeSettingsHost` | :242 | `children`, `reservesFloatingAction?` | adds `FAB_CLEARANCE` bottom padding on Android | 248 | 11: language, appearance, settings, settings-gallery, timezone-settings, about, user-calendar-detail, notification-days-ahead, user-calendars, notification-frequency, notification-settings |
| `NativeSettingsSection` | :299 (Swift :306, Compose :325) | `children`, `title?`, `footer?`, `testID?` | titled / untitled segment spacing | 300 | 11 (includes the `SettingsSection` wrapper) |
| `NativeSettingsRow` | :635 (Swift :647, Compose :703) | `kind: "navigation"\|"action"\|"value"`, `label`, `accessibilityLabel?`, `testID`, `icon?`, `hint?`, `subtitle?`, `value?`, `destructive?`, `badge?`, `href?`, `onPress?` | `kind` (navigation pushes `href`, action calls `onPress`, value is static `LabeledContent`); `destructive` (error color); `badge` | 636 | 8: timezone-settings, appearance, settings-row, settings-gallery, settings-screen, notification-settings, user-calendar-detail, user-calendars |
| `NativeSettingsSwitchRow` | :763 (Compose :783) | `label`, `value`, `testID`, `icon?`, `switchTestID?`, `onValueChange` | on/off | 764 | 5: settings-screen, settings-gallery, timezone-settings, user-calendar-detail, notification-settings |
| `NativeSettingsChoiceRow` | :823 (Swift :828, Compose :863) | `label`, `selected`, `selectedAccessibilityLabel`, `testID`, `onSelect` | selected (iOS checkmark + `accessibilityValue`; Android `RadioButton` + `selectable(…,"radioButton")`) | 824 | 5: settings-gallery, language-settings, appearance, notification-days-ahead, notification-frequency |
| `NativeSettingsRadioDialog<Value>` | :895 (Compose :906) | `visible`, `title`, `cancelLabel`, `value`, `options: {label,value}[]`, `testID`, `onSelect`, `onDismiss` | **Android only**: returns null on iOS (:898) | 898 | 3: settings-gallery, appearance, notification-settings |
| `NativeSettingsAlert` | :369 (Swift :375, Compose :429) | `title`, `message`, `testID`, `messageTestID`, `action?: {label, accessibilityLabel, testID, onPress}` | with / without action. Announces through `useErrorAnnouncement` | 371 | 4: settings-gallery, about, user-calendar-detail, notification-sync-status |
| `NativeSettingsFloatingAction` | :277 | `label`, `icon: NativeSettingsIcon`, `testID`, `onPress` | **Android only** (returns null on iOS, :283) | 283 | 2: settings-gallery, user-calendars-screen |
| Private: `ComposeSettingsHost` :226, `SwiftIconTile` :490 (the "Icon"), `SwiftRowLabel` :512, `SwiftBadge` :555, `SwiftDisclosureRowContent` :575, `SwiftActionRowContent` :607, `ComposeLeadingIcon` :690 | | | icon tiles are `accessibilityHidden()` | | private |

A11y in this file: SwiftUI `accessibilityIdentifier`/`accessibilityLabel`/`accessibilityHint`/`accessibilityValue` modifiers (label 8, hint 2, value 3). Compose uses the `testID` modifier and `selectable`/`toggleable`. There are 33 `testID` references.

---

## Feature-local components

Each feature's `ui/index.ts` barrel is listed first. "Barrel: yes" means the component is exported from that barrel. Every other exported component is reachable only by deep path inside its feature (or, where noted, by a cross-feature deep path).

### about

Barrel: `AboutScreen`.

| Component | Def | Purpose | Props | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AboutScreen` | `mobile/src/features/about/ui/about-screen.tsx:40` | About page: brand header + action/nav rows in one native host | none | route `app/about.tsx` | none | `about-screen.test.tsx`, 2: header + rows in one host, localized failure on rejected action | testID x9 | none (all chrome) |

Uses `SettingsSection` and `SettingsRow` from `@/features/settings/ui`, plus `NativeSettingsHeader` and `NativeSettingsAlert`.

### activity

Barrel: `ActivityScreen`.

| Component | Def | Purpose | Props | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ActivityScreen` | `mobile/src/features/activity/ui/activity-screen.tsx:42` | Sync-change history list, paged, pull-to-refresh | none | route | none | `activity-screen.test.tsx`, 12: loading/empty/populated/refresh-failure, older pages, routing, mark-read, headings + live alerts, long content | file: role 2, label 10, testID 14 | theme |
| `ActivityGroupHeader` (private) | `…/activity-screen.tsx:201` | Section header row | `section`, `time` | private | | indirect | heading | theme |
| `ActivityItemRow` (private) | `…:227` | One change row (pressable) | `item`, `formatTime` | private | | indirect | label | theme |
| `ActivityEmptyState` (private) | `…:307` | Wraps `EmptyState` with developer artwork | none | private | | indirect | | |
| `OlderFooter` (private) | `…:320` | Load-older spinner / retry footer | `loading`, `failed`, `onRetry` | private | | indirect | | |

### calendar

Barrel: `AgendaList`, `CalendarScreen`, `EventDetailsScreen`.

| Component | Def | Purpose | Props / variants | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `CalendarScreen` | `mobile/src/features/calendar/ui/calendar-screen.tsx:49` | Calendar tab: header, owned week/day shell or agenda | none | route | 225 | `calendar-screen.test.tsx`, 42 (paging, Day/Week/Agenda, Today, zoom, focus restore, announcements) | label 1, testID 2 | theme |
| `CalendarAgendaPane` | `…/calendar-agenda-pane.tsx:20` | Agenda view with status + refresh | `selectedDate`, `displayZone`, `locale`, `isSyncing`, `isError`, `onSync`, `refreshControl`, `onPressEvent(uid)` | 1: calendar-screen | none | indirect | testID 2 | `Spacing` |
| `AgendaList` | `…/agenda-list.tsx:45` | Day-grouped event list | `events`, `checklistProgress`, `locale`, `displayZone`, `refreshControl?`, `onPressEvent` | 1: calendar-agenda-pane (barrel-exported, no outside consumer) | none | indirect | role 4, label 2 | theme + **hard** `#000000` shadow (:200), `rgba(0,0,0,0.06)` (:249) |
| `DayHeader` / `EventTile` (private) | `…/agenda-list.tsx:110`, `:134` | Day heading / event row with progress | `day,locale,zone` / `event,progress,locale,zone,upcoming,onPress` | private | | indirect | | |
| `CalendarScreenHeader` | `…/calendar-screen/calendar-screen-header.tsx:21` | Title, context heading, view menu, actions | `title`, `compactTitle`, `contextHeading`, `pageKey`, `titleTargetActive`, `onTitleTargetChange`, `view`, `onViewChange`, `onToday?`, `onAdd`, `zoom` | 1 | 68, 145 | indirect | role 1, label 1 | theme |
| `CalendarHeaderTitle` (private) | `…:85` | Focusable title target | as above + `active`, `color` | private | | indirect | | |
| `CalendarHeaderActions` | `…/calendar-screen/calendar-screen-actions.tsx:10` | Today + Add header buttons | `onToday?`, `onAdd` | 1: calendar-screen-header | 28 | indirect | role 2, label 2 | theme |
| `HeaderIconAction` (private) | `…:40` | SF-symbol header button | `testID`, `symbol`, `label`, `onPress` | private | 59, 66 | indirect | | |
| `CalendarAddFab` | `…:74` | Android FAB (text glyph) | `onPress` | 1: calendar-screen | 99, 100 | indirect | role, label | theme + **hard** `#000000` shadow (:113), literal `fontSize` |
| `CalendarViewMenu` / `CalendarAndroidViewMenu` | `…/calendar-screen/calendar-view-menu.tsx:123`, `:129` | Day/Week/Agenda + zoom menu (`MenuView`) | `view`, `onChange`, `zoom`. The two exports differ only by `minimumTarget` 44/48 | 1 each: calendar-screen-header | split by export | indirect | role, label, `accessibilityActions` | theme |
| `CalendarPlatformMenu` (private) | `…:26` | Shared menu body | + `minimumTarget: 44\|48` | private | | | | |
| `CalendarScreenStatus` | `…/calendar-screen/calendar-screen-status.tsx:8` | Empty / error / syncing status for agenda | `isEmpty`, `isError`, `isSyncing`, `onRetry` | 1: calendar-agenda-pane | none | indirect | role 2, label 2, state, live | theme |
| `EventDetailsScreen` | `…/event-details-screen.tsx:28` | Event details route | none | route | none | `event-details-screen.test.tsx`, 32 | testID 2 | `Spacing` |
| `ResolvedEventDetails` (private) | `…:38` | Loaded details body | `event` | private | | indirect | | |
| `EventDetailsHeader` (+ `useEventDetailsAction` hook :16) | `…/event-details-actions.tsx:85` | Header right action (hide/unhide/edit) | `action?: EventDetailsAction` | 2: event-details-status, event-details-screen | none | indirect | role 1, label 5 | `Spacing` |
| `EventDetailsContent` | `…/event-details-content.tsx:20` | Title block, tags, content lines, checklist | `event`, `locale`, `displayZone` | 1 | none | indirect | label 1 | `Radii`, `Spacing` (no `useTheme`) |
| `TitleBlock`, `EventTags`, `TagBubble`, `ContentLine` (private) | `…:83`, `:118`, `:136`, `:146` | Details sub-blocks | see signatures | private | | indirect | | |
| `EventDetailsLoading` / `EventDetailsNotFound` | `…/event-details-status.tsx:10`, `:27` | Loading / not-found states | none | 1 each | none | indirect | role 2, live 2 | `Spacing` |
| `EventDetailsStatus` (private) | `…:43` | Shared status frame | `children` | private | | | | |

### calendar renderer (`src/features/calendar/renderer`, outside `ui/`)

Barrel `renderer/index.ts` exports only `OwnedCalendarShell` and types.

| Component | Def | Purpose | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `OwnedCalendarShell` | `mobile/src/features/calendar/renderer/owned-calendar-shell.tsx:94` | Owned week/day pager + time grid + header | 1: calendar-screen | none | `owned-calendar-shell.test.tsx`, 43, + 3 pager test files | accessible 4 | theme |
| `OwnedCalendarCanvas` + private `HorizontalPagerView` :164, `HourGutter` :230, `HourLabel` :265, `HourLines` :293, `GridLine` :333 | `…/owned-calendar-canvas.tsx:54` | Scroll/zoom canvas, hour gutter, grid lines | 1 (shell) | 39, 40 | indirect (shell) | accessible 5, ifa 4 | theme |
| `CalendarPage` + private `TileColumn` :187, `TileContent` :290, `StaticCalendarTile` :330, `TimedCalendarTile` :373, `LiveTileVisual` :457, `NowIndicator` :584 | `…/owned-calendar-page.tsx:98` | One page of event tiles + now line | 1 (shell) | 41 (`MINIMUM_TARGET` 44/48) | indirect | role 2, label 8, state, hint, accessible 9, ifa 7 | theme |
| `OwnedCalendarDateHeader` + private `HeaderSlot` :121 | `…/owned-calendar-header.tsx:23` | Pinned seven-day header (adjustable control) | 1 (shell) | none | indirect | role 2, label 2, `accessibilityActions`, accessible 7 | theme + 3 literal `fontSize` |
| `EventChooser` | `…/owned-calendar-chooser.tsx:9` | Modal list for a crowded conflict target. Props: `tiles`, `onChoose`, `onClose` | 1 (shell) | none | indirect | role 2, label 4 | theme + **hard** backdrop `rgba(0,0,0,0.4)` (:68) |
| `CalendarFocusObserverView` | `…/calendar-focus-observer.tsx:9` | `requireNativeView("CalendarFocusObserver")` wrapper | 1: owned-calendar-page | native module | none | n/a | n/a |

### calendar-sources

Barrel: `CalendarImportResultScreen`, `DevImportScreen`, `IcalUrlScreen`, `ImportProgressView`, `QrScanScreen`, `UserCalendarDetailScreen`, `UserCalendarsScreen`.

| Component | Def | Purpose | Props | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `UserCalendarsScreen` | `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx:22` | "My calendars" native list + add (iOS header / Android FAB) | none | route | 40 | 8 | label 2, testID 5 | theme |
| `UserCalendarDetailScreen` | `…/user-calendar-detail-screen.tsx:25` | Per-calendar settings: visibility switch, rename, delete | none | route | none | 20 | accessible 1, testID 6 | none (chrome) |
| `RenameCalendarDialog` | `…/rename-calendar-dialog.tsx:32` | Rename flow over `NativeTextEntryDialog` | `calendar: UserCalendar`, `onClose` | 1: user-calendar-detail-screen (not in barrel) | none | 13 | testID 10 | none |
| `IcalUrlScreen` | `…/ical-url-screen.tsx:53` | iCal URL import form | none | route | none | 13 | label 2, accessible 2 | theme, 1 literal `fontSize`, raw `TextInput` |
| `QrScanScreen` | `…/qr-scan-screen.tsx:24` | QR import controller screen | none | route | none | 14 | none in file | none |
| `QrScannerView` / `QrImportingView` / `QrImportFailureView` | `…/qr-import-views.tsx:19`, `:36`, `:41` | Camera / progress / failure views | `onBarcodeScanned`, `invalidPayload` / none / `retry`, `changeMethod` | 1 each: qr-scan-screen | none | indirect (qr-scan-screen) | label 2, hint 1 | theme |
| `QrCameraFrame` (private) | `…:78` | Full-bleed camera + overlay | `onBarcodeScanned`, `children?` | private | | | | |
| `QrPermissionLoadingView` / `QrPermissionRequestView` / `QrPermissionSettingsView` | `…/qr-permission-views.tsx:10`, `:25`, `:44` | Camera permission states | none / `requestPermission` / none | 1 each: qr-scan-screen | none | indirect | role 2, live 2 | `Spacing` |
| `PermissionFrame` (private) | `…:65` | Shared frame | `children` | private | | | | |
| `QrActionButton` | `…/qr-action-button.tsx:14` | Outlined secondary button (2px brand border) | `testID`, `label`, `text`, `onPress`, `disabled?` | 1: qr-permission-views | none | indirect | role, label, state | theme, `minHeight: 48` fixed (no iOS 44 split) |
| `ImportProgressView` | `…/import-progress-view.tsx:12` | Centered spinner + message | `message`, `testID?` | 3: ical-url-screen, calendar-import-result-screen, qr-import-views | none | indirect | role, live, accessible | theme |
| `CalendarImportResultScreen` | `…/calendar-import-result-screen.tsx:14` | Post-import sync result | none | route | none | 3 | role, live | `Spacing` |
| `DevImportScreen` | `…/dev-import-screen.tsx:34` | Development-variant token import (inert in production) | none | route | none | 5 | role 2, live, accessible | `Spacing` |

### changelog

Barrel: `ChangelogContent`, `ChangelogGate`, `ChangelogHistoryScreen`, `ChangelogSheetScreen`.

| Component | Def | Purpose | Props | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ChangelogContent` | `mobile/src/features/changelog/ui/changelog-content.tsx:15` | Newest-first release list | `releases`, `footer?` | 2: sheet + history screens | 94 | indirect via `changelog-screens.test.tsx` (6) | accessible, ifa, testID 4 | theme |
| `ChangelogSheetScreen` | `…/changelog-sheet-screen.tsx:19` | "What's new" sheet with Continue/close | none | route | none | `changelog-screens.test.tsx` | role 2, label, hint 2 | theme |
| `ChangelogHistoryScreen` | `…/changelog-history-screen.tsx:8` | History page | none | route | none | same | none | none |
| `ChangelogGate` | `…/changelog-gate.tsx:11` | Render-null gate that pushes the sheet once per migrated version | none | 1: `app/(tabs)/_layout.tsx` | none | `changelog-gate.test.tsx`, 2 (+ each) | n/a | n/a |

### environment

Barrel: `EnvironmentRuntimeGate`, `EnvironmentSettingsControl`.

| Component | Def | Purpose | Props | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `EnvironmentRuntimeGate` | `mobile/src/features/environment/ui/environment-runtime-gate.tsx:36` | Blocks children while an environment-switch journal resumes; recovery UI | `children` | 1: `app/_layout.tsx` | none | 4 | live, testID 2 | theme |
| `EnvironmentSettingsControl` | `…/environment-settings-control.tsx:16` | Preview/dev environment picker row in Settings | none | 1: settings-screen | none | 3 | role, label | none; imports `SettingsRow` by deep path `@/features/settings/ui/settings-row` |

### event-checklists

Barrel: `ChecklistProgressIndicator`, `checklistProgressLabel`, `ChecklistProgressVariant` (type), `EventChecklist`.

| Component | Def | Purpose | Props / variants | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `EventChecklist` | `mobile/src/features/event-checklists/ui/event-checklist.tsx:32` | Editable checklist section (add, toggle, reorder, remove) | `eventUid` | 1: event-details-content | none | 13 | role 6, label 6, state 4, live, accessible 2 | theme, raw `TextInput` |
| `ChecklistRow` (private) | `…:104` | One editable item row | `item`, `isFirst`, `isLast`, `autoFocus`, `inputStyle`, 5 callbacks | private | | indirect | | |
| `ChecklistProgressIndicator` | `…/checklist-progress-indicator.tsx:22` | Done/total badge | `progress`, `variant?: ChecklistProgressVariant` (default `"inline"`), `bounds?` | **5 cross-feature**: today-timeline, upcoming-scroller, today-section, agenda-list, owned-calendar-page | 55 | 5: zero omitted, inline hidden from a11y, complete glyph + tokens, bounded compact, label builder | ifa + hidden (decorative) | theme, 1 literal `fontSize` |

### export-guides

Barrel: `GuidePageScreen`, `ProviderSelectionScreen`, plus `coordinator` and `telemetry` (non-UI).

| Component | Def | Purpose | Props | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ProviderSelectionScreen` | `mobile/src/features/export-guides/ui/provider-selection-screen.tsx:26` | Ordered provider choice list | none | route | none | `guide-screens.test.tsx` (12) + `guide-load-integration.test.tsx` (2) | role 2, label 4, hint | theme |
| `GuidePageScreen` | `…/guide-page-screen.tsx:48` | Paged export guide | none | route | none | same | role 2, label 2, accessible | theme |
| `GuidePageContent` (private) | `…:191` | Loaded page body | `state`, `pageIndex`, `heading`, `dispatch` | private | | indirect | | |
| `ExportGuideImage` | `…/export-guide-image.tsx:11` | Guide image that degrades to text on failure | `image`, `testID`, `onFailure` | 1: guide-page-screen | none | indirect | role, label | theme |
| `GuideLoading` / `GuideBlockingError` | `…/guide-status.tsx:10`, `:27` | Loading / blocking error with retry | none / `retry`, `busy` | 2 each: both guide screens | none | indirect | role, live | theme |

### feedback

Barrel: `FeedbackScreen`, `normalizeFeedbackParam`.

| Component | Def | Purpose | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `FeedbackScreen` | `mobile/src/features/feedback/ui/feedback-screen.tsx:32` | Feedback form (e-mail, message) in `KeyboardSafeActionLayout` | route | none | 7 | role, label 4, live, testID 7 | theme, 3 raw `TextInput`, 1 literal `fontSize` |

### hidden-events

Barrel: `HiddenEventsScreen`.

| Component | Def | Purpose | Props | Consumers | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `HiddenEventsScreen` | `mobile/src/features/hidden-events/ui/hidden-events-screen.tsx:37` | Hidden names/instances with un-hide | none | route | 7 | role, label, accessible | theme |
| `HiddenRow` (private) | `…:148` | Title/subtitle row + un-hide button | `title`, `subtitle?`, `unhideLabel`, `onUnhide`, `background` | private | indirect | | theme |

### home

Barrel: `HomeScreen`.

| Component | Def | Purpose | Props | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `HomeScreen` | `mobile/src/features/home/ui/home-screen.tsx:22` | Today tab composition | none | route | 44, 102 (Android FAB) | `home-screen.test.tsx`, 14 | label, testID 3 | theme |
| `HomeScreenHeader` | `…/home-screen/home-screen-header.tsx:10` | Brand lockup + add (glass surface) | `onAdd` | 1 | 25 | indirect | role 2, label 2, hidden | theme + **hard** `#000000` shadow (:103), literal `fontSize` |
| `HomeAddFab` | `…/home-screen-header.tsx:46` | Android FAB (SF/MD `add` symbol) | `onPress` | 1 | (rendered Android-only by caller) | indirect | role, label | theme, fixed ripple radius 28 |
| `HomeScreenStatus` | `…/home-screen/home-screen-status.tsx:5` | Sync error banner wrapper over `ErrorNotice` | `isError`, `isSyncing?`, `onRetry` | 1 | none | indirect | label | none |
| `WelcomeCard` | `…/home-screen/welcome-card.tsx:29` | Greeting + day caption card | `now`, `locale`, `displayZone`, `caption`, `greeting`, `events` | 1 | none | indirect | role, hidden | theme + **hard** `#FFFFFF` (:123) |
| `TodaySection` | `…/home-screen/today-section.tsx:29` | Today's all-day list + timeline | `now`, `locale`, `displayZone`, `allDayEvents`, `timedEvents`, `checklistProgress`, `hourRange`, `onPressEvent` | 1 | 124, 146 | indirect | role 2, label, hint | theme |
| `AllDayEvents` (private) | `…:79` | All-day chip list | `events`, `checklistProgress`, `onPressEvent` | private | | | | |
| `UpcomingSection` | `…/home-screen/upcoming-section.tsx:36` | Upcoming scroller or next-day summary | 11 props (`laneStyle`, `contentInset`, `now`, `locale`, `displayZone`, `events`, `checklistProgress`, `todayEventCount`, `nextDay`, `onOpenCalendar`, `onPressEvent`) | 1 | 139, 159, 167, 168 | indirect | role 2, label 2 | theme |
| `NextDayCard` (private) | `…:111` | Next active day card | `day`, `count`, `firstStart`, `locale`, `displayZone`, `onPress` | private | | | | |
| `TodayTimeline` | `…/today-timeline.tsx:121` | Hour-grid timeline of today's events | `events`, `range`, `locale`, `displayZone`, `isToday`, `now`, `checklistProgress`, `onPressEvent` | 1: today-section | 54, 212, 346 | `today-timeline.test.tsx`, 7 | role 4, label 3, hint 2 | theme |
| `UpcomingScroller` | `…/upcoming-scroller.tsx:31` | Horizontal upcoming cards | `contentInset?`, `events`, `checklistProgress`, `locale`, `displayZone`, `onPressEvent` | 1: upcoming-section | 110, 136 | indirect | role, label, hint | theme |
| `UpcomingCard` (private) | `…:72` | One upcoming card | `event`, `progress`, `locale`, `zone`, `onPress` | private | | | | |

### legacy-migration (no `ui/index.ts`)

| Component | Def | Purpose | Props | Consumers | Tests |
| --- | --- | --- | --- | --- | --- |
| `BootstrapGate` | `mobile/src/features/legacy-migration/ui/bootstrap-gate.tsx:4` | Waits for `initialize()` before rendering children | `children`, `initialize` | 1: `app/_layout.tsx` | 2 |
| `MigrationReportRuntime` | `…/report-runtime.tsx:6` | Render-null runtime that retries the migration report | none | 1: `app/_layout.tsx` | 1 |
| `StartupTabsGate` | `…/startup-tabs-gate.tsx:7` | Lands migrated users on the Calendar tab before mounting the changelog | `children` | 1: `app/(tabs)/_layout.tsx` | 1 (+ each) |

### notifications

Barrel: `NotificationDaysAheadScreen`, `NotificationDaysCustomScreen`, `NotificationFrequencyScreen`, `NotificationSettingsScreen`.

| Component | Def | Purpose | Props | Consumers | Platform | Tests | A11y |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `NotificationSettingsScreen` | `mobile/src/features/notifications/ui/notification-settings-screen.tsx:37` | Notification form (switch, frequency, days ahead) | none | route | 98, 108 (iOS push route vs Android radio dialog) | 9 | testID 5 |
| `NotificationFrequencyScreen` | `…/notification-frequency-screen.tsx:14` | iOS choice page for frequency | none | route | none | `notification-choice-screens.test.tsx` (6) | testID |
| `NotificationDaysAheadScreen` | `…/notification-days-ahead-screen.tsx:17` | Choice page for days ahead | none | route | none | same | testID |
| `NotificationDaysCustomScreen` | `…/notification-days-custom-screen.tsx:21` | Custom days via `NativeSettingsNumericEditor` | none | route | none | same | none |
| `NotificationSyncStatus` | `…/notification-sync-status.tsx:6` | `NativeSettingsAlert` for sync failure + retry | `status: SyncStatus`, `retry` | 3: settings, frequency, days-ahead screens | none | 1 | label |

None of these files import `@/theme`; they are pure chrome composition.

### onboarding

Barrel: `ConnectScreen`, `InstitutionNameScreen`, `ManualImportScreen`, `ProgrammeScreen`, `WelcomeScreen`.

| Component | Def | Purpose | Props | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `WelcomeScreen` | `mobile/src/features/onboarding/ui/welcome-screen.tsx:21` | 3-page welcome pager | none | route | none | 9 | none in file | none |
| `WelcomePager` (forwardRef) | `…/welcome-pager.tsx:17` | `PagerView` of pages | `illustrationHeight`, `onPageSelected`, ref | 1 | none | indirect | testID | theme |
| `WelcomePage` | `…/welcome-pages.tsx:17` | Illustration + copy page | `illustrationBackgroundColor`, `illustrationHeight`, `page` | 1: welcome-pager | none | indirect | accessible 2, ifa | `Radii`, `Spacing` |
| `WelcomePageIndicator` | `…/welcome-page-indicator.tsx:73` | Grouped animated dots | `currentPage`, `reduceMotion` | 1 | 18 | indirect | label, accessible 2, ifa | theme |
| `IndicatorPill` (private) | `…:27` | One dot | `active`, `backgroundColor`, `index`, `reduceMotion` | private | | | | |
| `WelcomeSkip` / `WelcomeFooter` | `…/welcome-controls.tsx:16`, `:44` | Skip button / Next-or-Finish footer | `hidden`, `onPress` / `isLastPage`, `onFinish`, `onNext` | 1 each | 9 | indirect | role 3, label 3 | theme |
| `WelcomeEntrance` | `…/welcome-entrance.tsx:16` | Reanimated entrance that honors reduced motion | `children`, `reduceMotion` | 1 | none | indirect | testID | none |
| `InstitutionNameScreen` | `…/institution-name-screen.tsx:34` | Free-text institution step | none | route | none | 8 | label 3 | theme + `stepStyles`, raw `TextInput` |
| `ProgrammeScreen` | `…/programme-screen.tsx:38` | Programme name step with Skip | none | route | 96, 107 (header Skip) | 10 | role, label 5 | theme + `stepStyles`, raw `TextInput` |
| `ConnectScreen` | `…/connect-screen.tsx:36` | Institution intranet guidance + link | none | route | none | 4 | role 3, label 3 | theme + `stepStyles` |
| `ManualImportScreen` | `…/manual-import-screen.tsx:27` | QR / iCal method chooser | none | route | none | 4 | role 2, label 2, hint 2 | theme + `stepStyles` |

`stepStyles` (`mobile/src/features/onboarding/ui/step-styles.ts:18`) is a shared `StyleSheet` (`fill`, `safeArea`, `formContent`, `input`, `cta`) with 4 consumers: institution-name, connect, manual-import, programme. `cta` and `input` hardcode `minHeight: 48` and `fontSize: 16`.

### paging-spike (development spike)

Barrel: `PagingSpikeScreen`. Route `app/dev-paging-spike.tsx`. **No tests in the whole feature.** Hardcoded iOS-gray / pink hex palette throughout (`spike-page.tsx` lines 406-460, `spike-panel.tsx` 75-89, `spike-chrome.tsx` 164-167, `paging-spike-screen.tsx` 360-363). No `@/theme` import in any file.

| Component | Def | Purpose | Consumers |
| --- | --- | --- | --- |
| `PagingSpikeScreen` / `PagingSpike` (private) | `mobile/src/features/paging-spike/ui/paging-spike-screen.tsx:53`, `:61` | Pager/zoom experiment (Platform 268, 270) | route |
| `SpikeHeader`, `SharedGrid`, `SpikePager` | `…/spike-chrome.tsx:25`, `:68`, `:100` | Header strip, shared grid, animated pager | 1 each |
| `GridLine`, `HourLabel`, `PageWindow`, `HeaderWindow` | `…/spike-page.tsx:40`, `:67`, `:249`, `:284` | Grid primitives / page windows | 1 each (spike-chrome or spike screen) |
| `TileText`, `StaticTile`, `LiveTile`, `NowLine`, `SpikePage`, `HeaderSlot` (private) | `…/spike-page.tsx:111`, `:122`, `:150`, `:231`, `:310`, `:379` | Tiles / page internals | private |
| `SpikePanel` / `SpikeButton` (private) | `…/spike-panel.tsx:4`, `:49` | Debug control panel (Platform 29) | 1 / private |

### personal-events

Barrel: `PersonalEventFormScreen`, `PersonalEventsList`.

| Component | Def | Purpose | Props | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `PersonalEventsList` | `mobile/src/features/personal-events/ui/personal-events-list.tsx:23` | List + empty state + Add | none | route | none | 3 | role 2, label 2, hint, ifa, hidden | theme |
| `EventRow` (private) | `…:81` | Pressable event row | `event` | private | | indirect | | |
| `PersonalEventFormScreen` | `…/personal-event-form-screen.tsx:11` | Create/edit route | none | route | none | 22 | testID | none |
| `PersonalEventEditor` | `…/personal-event-editor.tsx:55` | Form state + `KeyboardSafeActionLayout` | `uid`, `existing`, `locale`, `displayZone` | 1 | none | indirect | testID | `Spacing` |
| `PersonalEventFields` | `…/personal-event-fields.tsx:31` | Title/location/description inputs, dates, color | `values`, `errors`, `locale`, `displayZone`, `update`, `onSubmitTitle`, `t` | 1 | none | indirect | label 5 | theme, 3 raw `TextInput`, 1 literal `fontSize` |
| `PersonalEventActions` | `…/personal-event-actions.tsx:20` | Save (`PrimaryAction`) + bespoke Delete button + error | `canDelete`, `isSaving`, `isDeleting`, `saveFailed`, `deleteFailed`, `onSave`, `onDelete`, `t` | 1 | none | indirect | role, label, state | theme |
| `DateTimeField` | `…/date-time-field.tsx:39` | Date/time control: iOS inline `DateTimePicker`, Android tap-to-open dialog | `testID?`, `accessibilityLabel?`, `value`, `locale`, `zone`, `onChange` | 1: personal-event-fields | 50 | `date-time-field.test.tsx`, 3 | role, label 3 | theme |
| `ColorSwatchPicker` | `…/color-swatch-picker.tsx:17` | Row of preset color swatches (radio-like) | `value`, `onChange(hex)` | 1: personal-event-fields | none | `color-swatch-picker.test.tsx`, 3 | role 2, label, state `{selected}` | theme. Presets are hex data in `color-swatch-presets.ts` (8 values) |

The delete confirmation is a hook (`use-personal-event-delete-confirmation.ts`), not a component, and it is not barrel-exported.

### school-selection

Barrel: `SchoolGroupPickerScreen`, `SchoolPickerScreen`.

| Component | Def | Purpose | Props | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SchoolPickerScreen` | `mobile/src/features/school-selection/ui/school-picker-screen.tsx:55` | Searchable school list (header search bar) | none | route | 42, 81, 119 | 25 | role, label 2, hint | theme |
| `MissingSchoolAction` (private) | `…:25` | "My school isn't listed" action | none | private | 42 | indirect | | |
| `SchoolRow` | `…/school-row.tsx:14` | Pressable school row with logo + subtitle | `school` | 1 | 58, 67, 92 (`Platform.select` body font) | indirect | role, label, hint | theme, literal `fontSize` |
| `SchoolLogo` (+ `LogoSize` const :10) | `…/school-logo.tsx:12` | Logo image or monogram fallback, light/dark | `school` | 1: school-row (`LogoSize` also used by row-separator) | none | indirect | testID 2 | theme |
| `RowSeparator` | `…/row-separator.tsx:9` | Inset hairline separator | none | 1: school-picker-screen | none | indirect | none | theme |
| `ListStatus` | `…/list-status.tsx:7` | Centered status (media + message + children) with announcement | `media`, `message`, `announceKey`, `alert?`, `children?` | 1: school-picker-screen | 24 (iOS announce) | indirect | role `alert`/`text`, live | `Spacing` |
| `StatusSymbol` | `…/status-symbol.tsx:6` | iOS-only 40pt SF symbol (null on Android) | `name: SFSymbol` | 1: school-picker-screen | 8 | indirect | none | theme |
| `SchoolGroupPickerScreen` | `…/school-group-picker-screen.tsx:30` | Group tree multi-select | none | route | none | 10 | role 5, label 3, state 2, live 2 | theme |
| `GroupNode` (private) | `…:165` | Recursive branch/leaf row | `node`, `selected`, `onToggleLeaf` | private | | indirect | | |

### settings

Barrel: `AppearanceSettingsScreen`, `LanguageSettingsScreen`, `SettingsGalleryScreen`, `SettingsRow` (+ `SettingsRowProps`), `SettingsScreen`, `SettingsSection`, `TimezoneChooserScreen`, `TimezoneSettingsScreen`. The feature barrel `features/settings/index.ts` re-exports `./ui`.

| Component | Def | Purpose | Props / variants | Consumers | Platform | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SettingsScreen` | `mobile/src/features/settings/ui/settings-screen.tsx:93` | Settings hub | none | route | none | 4 | testID 16 | none |
| `SettingsRow` | `…/settings-row.tsx:48` | Typed adapter over `NativeSettingsRow` | discriminated `variant?: "router"` (`href`, `hint`, `secondary?`, `badge?`) \| `"action"` (`onPress`, `hint`, `accessibilityRole?`, `secondary?`, `badge?`) \| `"value"` (`value`). Base: `icon?`, `label`, `accessibilityLabel?`, `testID`, `first?` | 2: about-screen, environment-settings-control. **Not used by `settings-screen.tsx`**, which uses `NativeSettingsRow` directly | none | **none** (indirect via about) | label passthrough | none |
| `SettingsSection` | `…/settings-section.tsx:11` | Pass-through to `NativeSettingsSection` | `title?`, `footer?`, `testID?`, `children` | 1: about-screen | none | **none** (indirect) | none | none |
| `AppearanceSettingsScreen` | `…/appearance-settings-screen.tsx:20` | Theme + language choice (iOS push, Android radio dialog) | none | route | 45, 70, 76, 79 | 5 (+ each) | testID 5 | none |
| `LanguageSettingsScreen` | `…/language-settings-screen.tsx:14` | Language choice page | none | route | none | 1 | testID | none |
| `TimezoneSettingsScreen` | `…/timezone-settings-screen.tsx:17` | Auto/manual timezone | none | route | none | 6 | testID 5 | none |
| `TimezoneChooserScreen` | `…/timezone-chooser-screen.tsx:38` | Searchable worldwide zone list (iOS 26 bottom toolbar) | none | route | 32, 130 | 11 | role 2, label 3, state | theme |
| `SettingsGalleryScreen` | `…/settings-gallery-screen.tsx:23` | Dev gallery of every chrome-seam primitive. Redirects in production | none | route `app/settings-gallery.tsx` | none | 2 | label, testID 15 | none |

`SettingsRow` declares `first?: boolean` (`settings-row.tsx:10`) but never reads it.

### splash

Barrel: `SplashScreen`.

| Component | Def | Purpose | Consumers | Tests | A11y | Tokens |
| --- | --- | --- | --- | --- | --- | --- |
| `SplashScreen` | `mobile/src/features/splash/ui/splash-screen.tsx:28` | Full-window brand overlay with reduced-motion fade | 1: `app/_layout.tsx` | 6 | role, label, live, accessible | theme |

---

## UI components outside these directories

| Component | Def | Purpose | Consumers |
| --- | --- | --- | --- |
| `ImportDraftProvider` | `mobile/src/features/onboarding/draft/context.tsx:42` | Context provider for the import draft | 1: `app/onboarding/_layout.tsx` (via `@/features/onboarding`) |
| `OtaUpdateRuntime` | `mobile/src/updates/ota-update-runtime.tsx:11` | Render-null OTA update listener | 1: `app/_layout.tsx` |
| `LocaleSynchronizer` | `mobile/src/i18n/locale-synchronizer.tsx:8` | Render-null device-locale sync | 1: `app/_layout.tsx` |
| `ProfileCompatibilityRedirect`, `MoreCompatibilityRedirect` | `mobile/src/app/profile.tsx:3`, `mobile/src/app/more.tsx:3` | Legacy route redirects | routes |

`src/hooks/` contains no `.tsx` files; no hook returns JSX. `src/app/**` route files only import `AppTabs` and `buildCompactRootScreenOptions` from `@/components` and re-export feature screens.

---

## Observations

### Zero or one consumer

- **Zero external consumers:** `ErrorTextAction` (exported but used only inside `error-surfaces.tsx`). `NativeErrorNotice` (barrel-exported; used only inside chrome by the dialog/editor parts). `Host` and `Picker` from `expo-ui.tsx` (barrel-exported, no imports anywhere).
- **Exactly one consumer, shared layer:** `AppTabs`, `NativeTabs`, `GlassSurface` (home header), `NativeTextEntryDialog` (rename dialog), `DateTimePicker` (date-time-field), `MenuView` (calendar-view-menu), `useHeaderOverlapInset` (root-page). `NativeSettingsFloatingAction`, `NativeSettingsHeader` and `NativeSettingsNumericEditor` have 2, one of which is the dev gallery or a sibling screen in the same feature.
- **Barrel-exported with no outside consumer:** `AgendaList` (calendar barrel; only calendar-agenda-pane uses it), `ImportProgressView` (calendar-sources barrel; used only inside the feature), `ChangelogContent` (used only by sibling screens).
- Almost every feature subcomponent has exactly one consumer, which is expected for screen decomposition (home-screen/*, calendar-screen/*, welcome-*, qr-*).

### Generic primitives trapped inside features (promotion candidates)

1. **`SettingsRow` / `SettingsSection`** (`features/settings/ui`). These are thin typed adapters over `NativeSettingsRow`/`NativeSettingsSection`, consumed by `about` (barrel) and `environment` (deep path `settings/ui/settings-row`). The settings hub itself does not use `SettingsRow`. Either fold the discriminated `variant` API into the chrome seam, or delete the adapter. Its `first` prop is dead.
2. **school-selection list kit:** `RowSeparator` (inset hairline, tied to `LogoSize`), `ListStatus` (centered status + iOS announce-once), `StatusSymbol` (iOS-only status glyph). Together these are a generic "list status / empty-search" pattern. `ListStatus` overlaps with `EmptyState` and `ImportProgressView`.
3. **personal-events form controls:** `ColorSwatchPicker` (accessible radio-like swatch row) and `DateTimeField` (platform date control over `DateTimePicker`). Both are generic, tested, and have one consumer.
4. **onboarding `stepStyles`:** a shared style block for 4 screens, including a text-input box and a CTA style that duplicate `PrimaryAction`'s role. A raw `TextInput` is restyled separately in `ical-url-screen`, `feedback-screen` (3), `personal-event-fields` (3), `event-checklist`, `institution-name-screen` and `programme-screen`. There is **no shared text-field primitive**.
5. **Buttons and FABs:** `QrActionButton` (outlined secondary, fixed 48 min height), the bespoke Delete button in `PersonalEventActions`, `HomeAddFab` and `CalendarAddFab` (two different Android FAB implementations, one with an SF/MD icon and one with a text glyph, plus `#000000` shadows), and `NativeSettingsFloatingAction` (Compose FAB). `PrimaryAction` is the only shared button, and it has no `variant` (secondary/outlined/destructive). `ErrorTextAction` is the de facto quiet/text variant but is named for errors.
6. **Status/progress views:** `ImportProgressView`, `GuideLoading`, `EventDetailsLoading`, `QrPermissionLoadingView`, and `CalendarScreenStatus`/`HomeScreenStatus` each implement a centered spinner/status. There is no shared loading-state primitive.
7. **`ChecklistProgressIndicator`** already works as a cross-feature primitive (5 consumers in home, calendar and the renderer). It is properly exported through the event-checklists barrel and is not a promotion target unless the barrel edge is unwanted.

### Test gaps

- **Shared layer without colocated tests:** `ThemedView`, `GlassSurface`, `NativeTabs` (covered only through `app-tabs.test.tsx`), `NativeTextEntryDialogIos`/`Android` (covered through the dispatcher test), `headerScrollProps`, `keyboard-avoiding-behavior.ts`, `use-error-announcement.ts` (indirect via error-surfaces/native-error-notice), and `native-settings-icons.ts`. `EmptyState` has a single `it.each` case.
- **`NativeErrorNotice`** has 1 case. **`NativeSettingsHeader`** and **`NativeSettingsNumericEditor`** have 2 each.
- **Feature primitives tested only through screens:** `SettingsRow`, `SettingsSection`, `RowSeparator`, `ListStatus`, `StatusSymbol`, `SchoolRow`, `SchoolLogo`, `QrActionButton`, `ImportProgressView`, `ExportGuideImage`, `UpcomingScroller`, `AgendaList`, `CalendarViewMenu`, `EventDetailsContent`, all `welcome-*` parts, `PersonalEventFields`/`Actions`/`Editor`.
- **No tests at all:** the whole `paging-spike` feature (6 files, 18 components, fully hardcoded colors) and `CalendarFocusObserverView`.
- Tests only cover branches the jest platform mock reaches. Per-file `Platform.OS` branches are exercised with explicit `describe` blocks in some suites (native-settings, text-entry-dialog, user-calendars, programme, school-picker). Other branching files (`HomeScreenHeader`, `TodaySection`, `UpcomingSection`, `SchoolRow`, `TimezoneChooserScreen`) have not been checked per branch (unverified).

### Token drift (quick flags)

- `ThemedText` owns the type scale as literal numbers rather than tokens. Literal `fontSize` also appears in `error-surfaces` (title 20), `native-settings-header` (4), `owned-calendar-header` (3), `checklist-progress-indicator`, `school-row`, `school-logo`, `feedback-screen`, `ical-url-screen`, `personal-event-fields`, `home-screen-header`, `today-section`, `upcoming-section`, `welcome-card`, `calendar-screen-actions`, and `stepStyles`.
- Hardcoded colors outside the spike: `#000000` shadows (`agenda-list.tsx:200`, `calendar-screen-actions.tsx:113`, `home-screen-header.tsx:103`), `rgba(0,0,0,0.06)` (`agenda-list.tsx:249`), `#FFFFFF` (`welcome-card.tsx:123`), and `rgba(0,0,0,0.4)` chooser backdrop (`owned-calendar-chooser.tsx:68`).
- The 44/48 minimum-target split is repeated by hand in `PrimaryAction`, `ErrorTextAction`, `CalendarViewMenu`, and `owned-calendar-page` (`MINIMUM_TARGET`). Several feature buttons fix `minHeight: 48` on both platforms (`QrActionButton`, `PersonalEventActions`, `stepStyles.cta`).
