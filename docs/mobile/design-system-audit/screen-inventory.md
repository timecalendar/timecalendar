# Mobile screen inventory (design-system audit, Phase 0)

Date: 2026-10-25

This file lists every route under `mobile/src/app/` and maps it to the component it renders. For each screen it records the components that screen uses, sorted into four groups: shared design-system components, feature-local components, raw React Native primitives, and third-party UI. It is the first input to the design-system audit. It describes the code as it is and does not propose changes.

## How it was produced

- Every file under `mobile/src/app/` was read in full. Each route re-export was followed through its barrel (`@/features/<x>/ui/index.ts` or `@/features/<x>/index.ts`) to the screen file.
- Every non-test `.tsx` file under `mobile/src/features/*/ui/`, `mobile/src/components/`, and the calendar renderer (`mobile/src/features/calendar/renderer/`) was scanned by a small script. For each file the script listed the import lines, every JSX opening tag with its line number, and every line that uses `Platform.OS`/`Platform.select`, `useTheme()`, a hex/rgba colour, or a dev-variant gate. A second pass dropped `<X` matches that are TypeScript generics (for example `useRef<Text>`, `SectionList<ActivityItem>`), so the raw-primitive counts below only include real JSX elements. The screen files and the key subcomponents were then read by hand to check the results.
- Each screen's component tree was followed one or two levels into feature-local subcomponents. The calendar renderer (`features/calendar/renderer/`) is counted separately because it is a subsystem of its own.
- **Raw RN count** is the number of JSX elements of `View`, `Text`, `Pressable`, `TextInput`, `ScrollView`, `FlatList`, `SectionList`, `ActivityIndicator`, `RefreshControl`, `Modal`, `KeyboardAvoidingView` and RN `Animated.View` imported from `react-native`, summed across the screen file and its feature-local subtree. `SafeAreaView` (from `react-native-safe-area-context`), `expo-image` `Image`, and reanimated `Animated.*` are counted as third-party, not raw RN.
- **Shared DS count** is the number of distinct components from `src/components/**` used in the tree. Helpers that render nothing themselves (`headerScrollProps`, `useAdaptiveLayout`) are mentioned but not counted.
- **Feature-local count** is the number of distinct components defined in `src/features/*/ui` (including components defined inside the screen file itself). Components imported from another feature are marked "cross-feature".
- The tokens flag is a quick indicator only: "tokens" means the tree uses `useTheme()`/`Spacing`/`Radii` from `@/theme`. Hardcoded colours and numeric style literals are noted where the scan found them. A separate drift audit covers this in full.
- Platform-suffixed files: there are no `*.ios.tsx`, `*.android.tsx` or `*.web.tsx` files anywhere under `mobile/src` (checked with `find src -name '*.ios.tsx' -o -name '*.android.tsx' -o -name '*.web.tsx'`, no results). All platform branching uses `Platform.OS` at runtime. The chrome layer splits by platform using separately named files (`native-text-entry-dialog-ios.tsx` / `-android.tsx`), selected at `mobile/src/components/chrome/native-text-entry-dialog.tsx:32`.
- `@howljs/calendar-kit` is **not** a dependency. `rg "calendar-kit|howljs" package.json src` returns nothing. The Calendar tab renders the in-house `OwnedCalendarShell` from `@/features/calendar/renderer` (`mobile/src/features/calendar/ui/calendar-screen.tsx:31`, `:180`).

## 1. Summary table

Route paths follow Expo Router: groups such as `(tabs)` do not appear in the URL. "FS" means formSheet presentation on iOS and fullScreenModal on Android, set in `mobile/src/app/_layout.tsx`.

| Route path | Route file | Screen component (file) | Feature | Shared DS | Feature-local | Raw RN | Third-party | Platform branching | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| (root layout) | `app/_layout.tsx` | `RootLayout` (same file) | — | 0 (uses `buildCompactRootScreenOptions`) | 1 (`SplashScreen`) + gates | 0 | Stack, ThemeProvider, GestureHandlerRootView | `Platform.OS` for sheet presentation (`:160`, `:174`, `:212`) | Mounts `BootstrapGate`, `EnvironmentRuntimeGate`, runtimes, `SplashScreen` |
| (tabs layout) | `app/(tabs)/_layout.tsx` | `AppTabs` (`components/app-tabs.tsx`) | — | 1 (`NativeTabs`) | 2 gates (`StartupTabsGate`, `ChangelogGate`) | 0 | expo-router native tabs (via chrome) | inside `NativeTabs` wrapper | Gates render `Redirect` / `null` |
| `/` | `app/(tabs)/index.tsx` | `HomeScreen` (`features/home/ui/home-screen.tsx`) | home | 5 | 11 + 1 cross-feature | 36 | SafeAreaView, expo-image, SymbolView | Yes (many) | tokens; `#000000` shadow, `#FFFFFF` border |
| (calendar layout) | `app/(tabs)/calendar/_layout.tsx` | `Stack` | — | 0 | 0 | 0 | Stack | No | `headerShown: true` |
| `/calendar` | `app/(tabs)/calendar/index.tsx` | `CalendarScreen` (`features/calendar/ui/calendar-screen.tsx`) | calendar | 4 | 12 + 1 cross-feature | 19 (+30 in renderer) | SafeAreaView, SymbolView, Stack.Screen, reanimated, gesture-handler | Yes (many) | tokens; `#000000` shadows; owned renderer |
| (settings layout) | `app/(tabs)/settings/_layout.tsx` | `Stack` | — | 0 | 0 | 0 | Stack | No | `headerLargeTitle: true` |
| `/settings` | `app/(tabs)/settings/index.tsx` | `SettingsScreen` (`features/settings/ui/settings-screen.tsx`) | settings | 4 | 0 + 1 cross-feature | 0 | — | No (inside chrome) | Shows Gallery link in non-production |
| `/about` | `app/about.tsx` | `AboutScreen` (`features/about/ui/about-screen.tsx`) | about | 3 | 0 + 2 cross-feature | 0 | Stack.Screen | No | Uses settings' `SettingsRow`/`SettingsSection` |
| `/activity` | `app/activity.tsx` | `ActivityScreen` (`features/activity/ui/activity-screen.tsx`) | activity | 5 | 4 | 10 | Stack.Screen | No | tokens |
| `/appearance-settings` | `app/appearance-settings.tsx` | `AppearanceSettingsScreen` (`features/settings/ui/appearance-settings-screen.tsx`) | settings | 5 | 0 | 0 | Stack.Screen | Yes | — |
| `/calendar-import-result` | `app/calendar-import-result.tsx` | `CalendarImportResultScreen` (`features/calendar-sources/ui/calendar-import-result-screen.tsx`) | calendar-sources | 4 | 1 | 4 | — | No | headerless |
| `/changelog` | `app/changelog.tsx` | `ChangelogHistoryScreen` (`features/changelog/ui/changelog-history-screen.tsx`) | changelog | 2 | 1 | 7 | Stack.Screen, SymbolView | Yes (in content) | tokens |
| `/changelog-sheet` | `app/changelog-sheet.tsx` | `ChangelogSheetScreen` (`features/changelog/ui/changelog-sheet-screen.tsx`) | changelog | 2 | 1 | 9 | Stack.Screen, SymbolView | Yes (in content) | FS sheet |
| `/dev-import` | `app/dev-import.tsx` | `DevImportScreen` (`features/calendar-sources/ui/dev-import-screen.tsx`) | calendar-sources | 3 | 0 | 3 | SafeAreaView, Stack.Screen | No | **Dev-only** (variant-gated action) |
| `/dev-paging-spike` | `app/dev-paging-spike.tsx` | `PagingSpikeScreen` (`features/paging-spike/ui/paging-spike-screen.tsx`) | paging-spike | 0 | ~16 | 27 | reanimated, gesture-handler, SafeAreaView, worklets | Yes | **Dev-only**; no theme; 21 hex literals |
| `/event-details/[uid]` | `app/event-details/[uid].tsx` | `EventDetailsScreen` (`features/calendar/ui/event-details-screen.tsx`) | calendar | 3 | 9 + 1 cross-feature | 12 (+10 in cross-feature checklist) | Stack.Screen | No | Checklist from event-checklists |
| `/feedback` | `app/feedback.tsx` | `FeedbackScreen` (`features/feedback/ui/feedback-screen.tsx`) | feedback | 7 | 0 | 5 | Stack.Screen | No | tokens |
| `/hidden-events` | `app/hidden-events.tsx` | `HiddenEventsScreen` (`features/hidden-events/ui/hidden-events-screen.tsx`) | hidden-events | 4 | 1 | 7 | Stack.Screen | No | tokens |
| `/language-settings` | `app/language-settings.tsx` | `LanguageSettingsScreen` (`features/settings/ui/language-settings-screen.tsx`) | settings | 3 | 0 | 0 | Stack.Screen | No | — |
| `/more` | `app/more.tsx` | `MoreCompatibilityRedirect` (same file) | — | 0 | 0 | 0 | Redirect | No | **Redirect → `/settings`** |
| `/notification-days-ahead` | `app/notification-days-ahead.tsx` | `NotificationDaysAheadScreen` (`features/notifications/ui/notification-days-ahead-screen.tsx`) | notifications | 4 | 1 | 0 | Stack.Screen | No | — |
| `/notification-days-custom` | `app/notification-days-custom.tsx` | `NotificationDaysCustomScreen` (`features/notifications/ui/notification-days-custom-screen.tsx`) | notifications | 1 | 0 | 0 | Stack.Screen | No (inside chrome) | FS sheet, 0.5 detent |
| `/notification-frequency` | `app/notification-frequency.tsx` | `NotificationFrequencyScreen` (`features/notifications/ui/notification-frequency-screen.tsx`) | notifications | 4 | 1 | 0 | Stack.Screen | No | — |
| `/notification-settings` | `app/notification-settings.tsx` | `NotificationSettingsScreen` (`features/notifications/ui/notification-settings-screen.tsx`) | notifications | 7 | 1 | 0 | Stack.Screen | Yes | — |
| (onboarding layout) | `app/onboarding/_layout.tsx` | `Stack` in `ImportDraftProvider` | onboarding | 0 (uses `buildCompactRootScreenOptions`) | 1 provider | 0 | Stack | No | — |
| `/onboarding` | `app/onboarding/index.tsx` | `WelcomeScreen` (`features/onboarding/ui/welcome-screen.tsx`) | onboarding | 3 | 7 | 7 | PagerView, reanimated, expo-image, SymbolView, SafeAreaView | Yes | headerless |
| `/onboarding/school` | `app/onboarding/school.tsx` | `SchoolPickerScreen` (`features/school-selection/ui/school-picker-screen.tsx`) | school-selection | 6 | 6 | 10 | Stack.Screen, expo-image, SymbolView | Yes (many) | tokens |
| `/onboarding/institution-name` | `app/onboarding/institution-name.tsx` | `InstitutionNameScreen` (`features/onboarding/ui/institution-name-screen.tsx`) | onboarding | 6 | 0 | 1 | Stack.Screen | No | tokens |
| `/onboarding/programme` | `app/onboarding/programme.tsx` | `ProgrammeScreen` (`features/onboarding/ui/programme-screen.tsx`) | onboarding | 6 | 0 | 2 | Stack.Screen | Yes | tokens |
| `/onboarding/connect` | `app/onboarding/connect.tsx` | `ConnectScreen` (`features/onboarding/ui/connect-screen.tsx`) | onboarding | 3 | 0 | 4 | Stack.Screen, SymbolView | No | 4 numeric style literals |
| `/onboarding/import` | `app/onboarding/import.tsx` | `ManualImportScreen` (`features/onboarding/ui/manual-import-screen.tsx`) | onboarding | 3 | 0 | 2 | Stack.Screen, SymbolView | No | — |
| `/onboarding/qr-scan` | `app/onboarding/qr-scan.tsx` | `QrScanScreen` (`features/calendar-sources/ui/qr-scan-screen.tsx`) | calendar-sources | 7 | 10 | 5 | expo-camera CameraView, SafeAreaView, Stack.Screen | No | tokens |
| `/onboarding/ical-url` | `app/onboarding/ical-url.tsx` | `IcalUrlScreen` (`features/calendar-sources/ui/ical-url-screen.tsx`) | calendar-sources | 7 | 1 | 3 | Stack.Screen | No | tokens |
| `/onboarding/groups` | `app/onboarding/groups.tsx` | `SchoolGroupPickerScreen` (`features/school-selection/ui/school-group-picker-screen.tsx`) | school-selection | 5 | 1 | 7 | Stack.Screen | No | tokens |
| `/onboarding/export-guide/providers` | `app/onboarding/export-guide/providers.tsx` | `ProviderSelectionScreen` (`features/export-guides/ui/provider-selection-screen.tsx`) | export-guides | 4 | 2 | 6 | expo-image, Stack.Screen | No | tokens |
| `/onboarding/export-guide/[pageIndex]` | `app/onboarding/export-guide/[pageIndex].tsx` | `GuidePageScreen` (`features/export-guides/ui/guide-page-screen.tsx`) | export-guides | 5 | 4 | 8 | expo-image, Stack.Screen | No | tokens |
| `/personal-event-form` | `app/personal-event-form.tsx` | `PersonalEventFormScreen` (`features/personal-events/ui/personal-event-form-screen.tsx`) | personal-events | 7 | 5 | 14 | Stack.Screen | Yes | tokens |
| `/personal-events` | `app/personal-events.tsx` | `PersonalEventsList` (`features/personal-events/ui/personal-events-list.tsx`) | personal-events | 3 | 1 | 6 | Link (asChild), Stack.Screen | No | 4 numeric literals |
| `/profile` | `app/profile.tsx` | `ProfileCompatibilityRedirect` (same file) | — | 0 | 0 | 0 | Redirect | No | **Redirect → `/settings`** |
| `/settings-gallery` | `app/settings-gallery.tsx` | `SettingsGalleryScreen` (`features/settings/ui/settings-gallery-screen.tsx`) | settings | 9 | 0 | 1 | Stack.Screen, Redirect | No (inside chrome) | **Non-production only** (capability gate) |
| `/timezone-chooser` | `app/timezone-chooser.tsx` | `TimezoneChooserScreen` (`features/settings/ui/timezone-chooser-screen.tsx`) | settings | 1 | 0 | 5 | Stack.SearchBar, Stack.Toolbar | Yes | FS sheet; no RootPage |
| `/timezone-settings` | `app/timezone-settings.tsx` | `TimezoneSettingsScreen` (`features/settings/ui/timezone-settings-screen.tsx`) | settings | 4 | 0 | 0 | Stack.Screen | No | — |
| `/user-calendars` | `app/user-calendars.tsx` | `UserCalendarsScreen` (`features/calendar-sources/ui/user-calendars-screen.tsx`) | calendar-sources | 6 | 0 | 2 | Stack.Screen (header items) | Yes | tokens |
| `/user-calendars/[id]` | `app/user-calendars/[id].tsx` | `UserCalendarDetailScreen` (`features/calendar-sources/ui/user-calendar-detail-screen.tsx`) | calendar-sources | 6 | 1 | 0 | Stack.Screen | No (inside chrome) | — |

Route count: 44 files under `mobile/src/app/`. That is 5 layouts (`_layout.tsx`, `(tabs)/_layout.tsx`, `(tabs)/calendar/_layout.tsx`, `(tabs)/settings/_layout.tsx`, `onboarding/_layout.tsx`), 2 redirects (`more`, `profile`), and 37 screen routes.

## 2. Per-screen sections

All paths are relative to the repo root. Line numbers come from the files as read on 2026-10-25.

### 2.1 Layouts

#### Root layout: `mobile/src/app/_layout.tsx`
- Renders `GestureHandlerRootView` → `BootstrapGate` (schema) → `EnvironmentRuntimeGate` → `BootstrapGate` (legacy migration) → `PersistQueryClientProvider` → runtime components that render `null` (`OtaUpdateRuntime`, `MigrationReportRuntime`, `StartupSync`, `ActivityRuntime`, `NotificationRuntime`, `NotificationTapRouting`, `LocaleSynchronizer`) → `ThemeProvider` → `Stack` + `SplashScreen` (`mobile/src/app/_layout.tsx:113-250`).
- Shared: `buildCompactRootScreenOptions` from `@/components/chrome` (`mobile/src/app/_layout.tsx:17`, `:107`). Theme: `buildNavTheme`, `Colors` (`:39`, `:106-109`).
- Platform branching: the `changelog-sheet`, `timezone-chooser` and `notification-days-custom` routes use `formSheet` on iOS and `fullScreenModal` on Android (`mobile/src/app/_layout.tsx:160`, `:174`, `:212`).
- Headerless routes: `(tabs)`, `profile`, `more`, `onboarding`, `calendar-import-result`, `dev-import`, `dev-paging-spike` (`mobile/src/app/_layout.tsx:134-150`, `:231-240`).
- Raw RN: none in JSX. Uses `StyleSheet` for the root `flex: 1` (`:254-258`).
- Feature-local UI mounted here:
  - `SplashScreen` (`mobile/src/features/splash/ui/splash-screen.tsx`): RN `Animated.View` ×1 (`:99`), `ThemedText` ×1 (`:110`), `useTheme` (`:30`).
  - `EnvironmentRuntimeGate` (`mobile/src/features/environment/ui/environment-runtime-gate.tsx`): `SafeAreaView` (`:75`), `ScrollView` (`:78`), `ActivityIndicator` (`:84`), `ThemedText` (`:85`), `ErrorState` (`:90`), `useTheme` (`:38`).

#### Tabs layout: `mobile/src/app/(tabs)/_layout.tsx`
- `StartupTabsGate` → `ChangelogGate` + `AppTabs` (`mobile/src/app/(tabs)/_layout.tsx:9-12`).
- `AppTabs` (`mobile/src/components/app-tabs.tsx:9-33`) uses the chrome `NativeTabs` with three triggers: `index` (custom PNG icon, `:14-17`), `calendar` (`sf="calendar" md="calendar_month"`, `:24`) and `settings` (`sf="gearshape" md="settings"`, `:31`).
- `NativeTabs` wraps `expo-router/unstable-native-tabs` (`mobile/src/components/chrome/native-tabs.tsx:1`). It sets an Android-only background colour (`:34`).
- `StartupTabsGate` renders an expo-router `Redirect` (`mobile/src/features/legacy-migration/ui/startup-tabs-gate.tsx:15`). `ChangelogGate` renders `null` and pushes `/changelog-sheet` (`mobile/src/features/changelog/ui/changelog-gate.tsx:22`, `:27`).

#### Calendar tab stack: `mobile/src/app/(tabs)/calendar/_layout.tsx`
- `<Stack screenOptions={{ headerShown: true }} />` (`:10`).

#### Settings tab stack: `mobile/src/app/(tabs)/settings/_layout.tsx`
- `Stack` with `headerShown`, `headerLargeTitle`, and a localized title (`:8-14`).

#### Onboarding stack: `mobile/src/app/onboarding/_layout.tsx`
- `ImportDraftProvider` (from `@/features/onboarding`, `:4`) wraps a `Stack` with `buildCompactRootScreenOptions` (`:21-23`). Only `index` is headerless (`:28`).

### 2.2 Tab screens

#### `/` — Home (`mobile/src/features/home/ui/home-screen.tsx`)
Route: `mobile/src/app/(tabs)/index.tsx:1` → `@/features/home/ui` → `mobile/src/features/home/ui/index.ts:2`.
- **Shared DS (5):** `ThemedView` (`home-screen.tsx:29`), `ThemedText` (subcomponents, e.g. `home-screen/home-screen-header.tsx:21`), `GlassSurface` (`home-screen/home-screen-header.tsx:26`, iOS only), `ErrorNotice` (`home-screen/home-screen-status.tsx:17`), `EmptyState` (`home-screen/today-section.tsx:45`, `home-screen/upcoming-section.tsx:57`). Helper: `useAdaptiveLayout` (`home-screen.tsx:11`).
- **Feature-local (11):** `HomeScreenHeader`, `HomeAddFab` (`home-screen/home-screen-header.tsx:10`, `:46`), `HomeScreenStatus` (`home-screen/home-screen-status.tsx:5`), `WelcomeCard` (`home-screen/welcome-card.tsx:29`), `UpcomingSection` + `NextDayCard` (`home-screen/upcoming-section.tsx:36`, `:111`), `UpcomingScroller` + `UpcomingCard` (`upcoming-scroller.tsx:31`, `:72`), `TodaySection` + `AllDayEvents` (`home-screen/today-section.tsx:29`, `:79`), `TodayTimeline` (`today-timeline.tsx:121`).
- **Cross-feature UI:** `ChecklistProgressIndicator` from `@/features/event-checklists` (`home-screen/today-section.tsx:7`, `today-timeline.tsx:30`, `upcoming-scroller.tsx:11`).
- **Raw RN (36):** `home-screen.tsx`: View ×4 (`:31,36,59,89`), ScrollView ×1 (`:39`), RefreshControl ×1 (`:49`). `home-screen-header.tsx`: View ×2 (`:14,15`), Pressable ×2 (`:31,50`). `today-section.tsx`: View ×3 (`:43,92,101`), Pressable ×1 (`:105`). `upcoming-section.tsx`: View ×4 (`:54,55,90,96`), Pressable ×2 (`:69,130`). `welcome-card.tsx`: View ×4 (`:61,72,73,75`). `today-timeline.tsx`: View ×8 (`:184,234,235,242,250,273,280,377`), Pressable ×2 (`:195,320`). `upcoming-scroller.tsx`: ScrollView ×1 (`:49`), Pressable ×1 (`:94`). Totals: View 25, Pressable 8, ScrollView 2, RefreshControl 1.
- **Third-party:** `SafeAreaView` (`home-screen.tsx:30`), expo-image `Image` (`home-screen-header.tsx:16`), `SymbolView` (`home-screen-header.tsx:38,58`).
- **Platform branching:** `home-screen.tsx:44`, `:102` (Android-only FAB). `home-screen-header.tsx:25` (iOS-only glass button). `today-section.tsx:124,146`, `upcoming-section.tsx:139,159,167-168`, `today-timeline.tsx:54,212,346`, `upcoming-scroller.tsx:110,136`. These are mostly 44/48 target sizes and iOS press opacity.
- **Tokens:** uses `useTheme`/`Spacing`/`Radii` throughout. Hardcoded: `shadowColor: "#000000"` (`home-screen-header.tsx:103`), `borderColor: "#FFFFFF"` (`welcome-card.tsx:123`), 8 numeric style literals in `home-screen-header.tsx`.
- Dev-only: no.

#### `/calendar` — Calendar (`mobile/src/features/calendar/ui/calendar-screen.tsx`)
Route: `mobile/src/app/(tabs)/calendar/index.tsx:1` → `mobile/src/features/calendar/ui/index.ts:2`.
- **Shared DS (4):** `ThemedView` (`calendar-screen.tsx:144`), `ThemedText` (e.g. `calendar-screen/calendar-view-menu.tsx:107`, `agenda-list.tsx:126`), `ErrorNotice` (`calendar-screen/calendar-screen-status.tsx:54`), `MenuView` from chrome (`calendar-screen/calendar-view-menu.tsx:5`, `:84`). Helper: `useAdaptiveLayout` (`calendar-agenda-pane.tsx:4`).
- **Feature-local (12):** `CalendarScreenHeader`, `CalendarHeaderTitle` (`calendar-screen/calendar-screen-header.tsx:21`, `:85`), `CalendarViewMenu`/`CalendarAndroidViewMenu`/`CalendarPlatformMenu` (`calendar-screen/calendar-view-menu.tsx:26,123,129`), `CalendarHeaderActions`, `HeaderIconAction`, `CalendarAddFab` (`calendar-screen/calendar-screen-actions.tsx:10,40,74`), `CalendarAgendaPane` (`calendar-agenda-pane.tsx`), `CalendarScreenStatus` (`calendar-screen/calendar-screen-status.tsx:8`), `AgendaList`, `DayHeader`, `EventTile` (`agenda-list.tsx:45,110,134`), `OwnedCalendarShell` (`@/features/calendar/renderer`, `calendar-screen.tsx:180`).
- **Cross-feature UI:** `ChecklistProgressIndicator` (`agenda-list.tsx:20`, `:215`; also `renderer/owned-calendar-page.tsx:25`, `:319`).
- **Raw RN in `ui/` (19):** `calendar-screen.tsx`: RefreshControl ×1 (`:133`), View ×1 (`:163`). `calendar-screen-header.tsx`: **Text ×1** (`:129`, raw `Text` with a hardcoded `fontSize: Platform.OS === "ios" ? 17 : 20` at `:145`). `calendar-screen-actions.tsx`: View ×1 (`:19`), Pressable ×2 (`:53,78`). `calendar-view-menu.tsx`: Pressable ×1 (`:89`), View ×2 (`:100,116`). `calendar-agenda-pane.tsx`: View ×2 (`:51,56`). `agenda-list.tsx`: SectionList ×1 (`:86`), View ×3 (`:122,175,176`), Pressable ×1 (`:186`). `calendar-screen-status.tsx`: View ×2 (`:23,25`), Pressable ×1 (`:34`).
- **Raw RN in renderer (30):** `owned-calendar-shell.tsx` View ×1 (`:255`). `owned-calendar-canvas.tsx` View ×3 (`:241,246,303`). `owned-calendar-header.tsx` View ×6 (`:59,70,94,151,161,191`). `owned-calendar-page.tsx` View ×13, Pressable ×2 (`:240,402`). `owned-calendar-chooser.tsx` **Modal ×1** (`:21`), View ×2, Pressable ×2 (`:39,49`). Plus reanimated `Animated.View`/`Animated.ScrollView` in canvas, header and page.
- **Third-party:** `SafeAreaView` (`calendar-screen.tsx:158`), `SymbolView` (`calendar-screen-actions.tsx:65`), `Stack.Screen` header options (`calendar-screen-header.tsx:48`), reanimated and `GestureDetector` (renderer, e.g. `owned-calendar-shell.tsx:291`), a native view through `requireNativeView` (`renderer/calendar-focus-observer.tsx:1`).
- **Platform branching:** `calendar-screen.tsx:225` (Android FAB). `calendar-screen-header.tsx:68` (Android vs iOS view menu), `:145`. `calendar-screen-actions.tsx:28,59,66,99-100`. Renderer `owned-calendar-canvas.tsx:39-40`, `owned-calendar-page.tsx:41`.
- **Tokens:** `useTheme` used. Hardcoded: `shadowColor: "#000000"` (`agenda-list.tsx:200`, `calendar-screen-actions.tsx:113`), `rgba(0, 0, 0, 0.4)` scrim (`renderer/owned-calendar-chooser.tsx:68`), 6 numeric literals in `calendar-view-menu.tsx` (e.g. `minHeight: 36`, `minWidth: 88`, `paddingHorizontal: 12` at `:138-140`).
- Dev-only: no. A dev-variant accessibility probe is wired in (`calendar-screen.tsx:54`).

#### `/settings` — Settings hub (`mobile/src/features/settings/ui/settings-screen.tsx`)
Route: `mobile/src/app/(tabs)/settings/index.tsx:1` → `mobile/src/features/settings/ui/index.ts:5`.
- **Shared DS (4):** `NativeSettingsHost` (`:110`), `NativeSettingsSection` ×3 (`:111,143,172`), `NativeSettingsRow` ×4 (`:116,123,153,177`), `NativeSettingsSwitchRow` (`:133`).
- **Feature-local:** none of its own. Note: the settings feature exports `SettingsRow`/`SettingsSection` wrappers (`mobile/src/features/settings/ui/index.ts:4,6`), but this screen does not use them. It uses `NativeSettingsRow` directly.
- **Cross-feature UI:** `EnvironmentSettingsControl` from `@/features/environment` (`:14`, `:176`). That control renders settings' own `SettingsRow` (`mobile/src/features/environment/ui/environment-settings-control.tsx:14`, `:70`), so the two features import UI from each other.
- **Raw RN:** 0. **Third-party:** none directly. **Platform branching:** none in this file; all of it is inside the chrome layer.
- Gating: the environment section and the Settings Gallery row render only when `getBackendEnvironmentCapability() !== "production"` (`:100-101`, `:171-186`).

### 2.3 Settings-family stack screens

#### `/about` (`mobile/src/features/about/ui/about-screen.tsx`)
Route: `mobile/src/app/about.tsx:1` → `mobile/src/features/about/ui/index.ts:1`.
- **Shared DS (3):** `NativeSettingsHost` (`:154`), `NativeSettingsHeader` (`:155`), `NativeSettingsAlert` (`:164`).
- **Cross-feature UI (2):** `SettingsSection` (`:172`) and `SettingsRow` (`:178`), imported from `@/features/settings/ui` (`:14`). Both are thin wrappers over `NativeSettingsSection`/`NativeSettingsRow` (`mobile/src/features/settings/ui/settings-section.tsx:12`, `mobile/src/features/settings/ui/settings-row.tsx:51,63,77`).
- **Raw RN:** 0. **Third-party:** `Stack.Screen` (`:153`), plus the non-UI APIs `expo-web-browser` and `expo-linking` (`:1`, `:3`).
- Platform branching: none. Tokens: no direct styles.

#### `/appearance-settings` (`mobile/src/features/settings/ui/appearance-settings-screen.tsx`)
- **Shared DS (5):** `NativeSettingsHost` (`:43`), `NativeSettingsSection` ×2 (`:44,68`), `NativeSettingsChoiceRow` (`:47`), `NativeSettingsRow` ×2 (`:57,69`), `NativeSettingsRadioDialog` ×2 (`:86,99`).
- **Raw RN:** 0. **Third-party:** `Stack.Screen` (`:42`).
- **Platform branching:** iOS shows inline choice rows and Android shows a radio dialog (`:45`, `:79`). The row kind (`:70`) and an iOS-only `href` (`:76`) also depend on platform.

#### `/language-settings` (`mobile/src/features/settings/ui/language-settings-screen.tsx`)
- **Shared DS (3):** `NativeSettingsHost` (`:25`), `NativeSettingsSection` (`:26`), `NativeSettingsChoiceRow` (`:28`). **Raw RN:** 0. `Stack.Screen` (`:24`). No platform branching.

#### `/timezone-settings` (`mobile/src/features/settings/ui/timezone-settings-screen.tsx`)
- **Shared DS (4):** `NativeSettingsHost` (`:34`), `NativeSettingsSection` (`:35`), `NativeSettingsSwitchRow` (`:36`), `NativeSettingsRow` ×3 (`:46,54,66`). **Raw RN:** 0. `Stack.Screen` (`:33`).

#### `/timezone-chooser` (`mobile/src/features/settings/ui/timezone-chooser-screen.tsx`)
- **Shared DS (1):** `ThemedText` ×6 (`:100,101,102,106,110,166`). It does not use `RootPage`, a chrome row, or `EmptyState`.
- **Raw RN (5):** Pressable ×1 (`:85`, the row from `renderItem`), View ×3 (`:99,104,161`), FlatList ×1 (`:151`).
- **Third-party:** `Stack.Screen` (`:120`), `Stack.SearchBar` (`:121`), `Stack.Toolbar` with `Stack.Toolbar.Button` and `Stack.Toolbar.SearchBarSlot` (`:131-148`).
- **Platform branching:** `:32` and `:130` (iOS close button / bottom search toolbar).
- **Tokens:** `useTheme().separator` (`:56`) and `Spacing`. 1 numeric literal.
- Presentation: FS sheet with detents 0.85/1 (`mobile/src/app/_layout.tsx:170-178`).

#### `/settings-gallery` — see [section 3](#3-settings-gallery).

#### `/notification-settings` (`mobile/src/features/notifications/ui/notification-settings-screen.tsx`)
- **Shared DS (7):** `NativeSettingsHost` (`:76`), `NativeSettingsSection` ×3 (`:81,93,106`), `NativeSettingsSwitchRow` (`:85`), `NativeSettingsRow` ×2 (`:97,107`), `NativeSettingsRadioDialog` ×2 (`:118,134`), `NativeSettingsNumericEditor` (`:151`), and `NativeSettingsAlert` through the local status component.
- **Feature-local (1):** `NotificationSyncStatus` (`:77`). It wraps `NativeSettingsAlert` (`mobile/src/features/notifications/ui/notification-sync-status.tsx:16`).
- **Raw RN:** 0. **Platform branching:** row `kind` is navigation on iOS and action on Android (`:98`, `:108`).

#### `/notification-frequency` (`mobile/src/features/notifications/ui/notification-frequency-screen.tsx`)
- **Shared DS (4):** `NativeSettingsHost` (`:20`), `NativeSettingsSection` (`:21`), `NativeSettingsChoiceRow` (`:23`), and `NativeSettingsAlert` through `NotificationSyncStatus` (`:36`). **Raw RN:** 0.

#### `/notification-days-ahead` (`mobile/src/features/notifications/ui/notification-days-ahead-screen.tsx`)
- **Shared DS (4):** `NativeSettingsHost` (`:27`), `NativeSettingsSection` (`:28`), `NativeSettingsChoiceRow` (`:30`), and `NativeSettingsAlert` through `NotificationSyncStatus` (`:53`). **Raw RN:** 0.

#### `/notification-days-custom` (`mobile/src/features/notifications/ui/notification-days-custom-screen.tsx`)
- **Shared DS (1):** `NativeSettingsNumericEditor` (`:29`). It is a SwiftUI `Form` on iOS and a Compose `AlertDialog` on Android, selected at `mobile/src/components/chrome/native-settings-numeric-editor.tsx:177`. **Raw RN:** 0. `Stack.Screen` (`:28`). Presentation: FS sheet, 0.5 detent (`mobile/src/app/_layout.tsx:208-216`).

#### `/activity` (`mobile/src/features/activity/ui/activity-screen.tsx`)
- **Shared DS (5):** `RootPage` (`:106`), `ThemedText` ×6 (`:219,220,247,250,252,262`), `ErrorState` (`:126`), `ErrorNotice` ×2 (`:150,343`), `EmptyState` (`:310`). Helper: `headerScrollProps` (`:17`).
- **Feature-local (4, same file):** `ActivityGroupHeader` (`:201`), `ActivityItemRow` (`:227`), `ActivityEmptyState` (`:307`), `OlderFooter` (`:320`).
- **Raw RN (10):** RefreshControl ×1 (`:93`), View ×4 (`:113,114,211,286`), ActivityIndicator ×2 (`:115,333`), ScrollView ×1 (`:122`), SectionList ×1 (`:140`), Pressable ×1 (`:293`).
- **Third-party:** `Stack.Screen` (`:105`). Platform branching: none. Tokens: `useTheme` ×4 (`:44,209,235,330`), `Radii`/`Spacing`, 1 numeric literal.

#### `/feedback` (`mobile/src/features/feedback/ui/feedback-screen.tsx`)
- **Shared DS (7):** `RootPage` (`:93`), `KeyboardSafeActionLayout` (`:99`), `ErrorNotice` (`:108`), `PrimaryAction` (`:113`), `PageIntro` (`:132`), `ThemedText` ×3 (`:120,135,171`), `FieldError` ×2 (`:167,202`).
- **Raw RN (5):** View ×3 (`:131,134,170`), TextInput ×2 (`:138,174`). It also uses the RN `Alert` API (`:4`).
- **Third-party:** `Stack.Screen` (`:92`). Platform branching: none. Tokens: `useTheme` (`:34`), 3 numeric literals.

#### `/hidden-events` (`mobile/src/features/hidden-events/ui/hidden-events-screen.tsx`)
- **Shared DS (4):** `RootPage` (`:71`), `ErrorNotice` (`:83`), `EmptyState` (`:91`), `ThemedText` ×5 (`:103,122,165,167,179`). Helper: `headerScrollProps` (`:8`).
- **Feature-local (1):** `HiddenRow` (`:148`, used at `:107`, `:126`).
- **Raw RN (7):** ScrollView ×1 (`:77`), View ×5 (`:90,102,121,163,164`), Pressable ×1 (`:172`).
- `Stack.Screen` (`:70`). Platform branching: none. Tokens: `useTheme` (`:39`), 2 numeric literals.

#### `/changelog` (`mobile/src/features/changelog/ui/changelog-history-screen.tsx`)
- The screen is `Stack.Screen` (`:12`) plus `ChangelogContent` (`:13`).
- `ChangelogContent` (`mobile/src/features/changelog/ui/changelog-content.tsx`): **Shared DS (2):** `RootPage` (`:20`), `ThemedText` ×3 (`:38,65,68`). **Raw RN (7):** ScrollView ×1 (`:22`), View ×6 (`:28,33,41,43,50,64`). **Third-party:** `SymbolView` (`:58`). **Platform:** `minHeight: Platform.OS === "ios" ? 72 : 76` (`:94`). Tokens: `useTheme` (`:17`), 4 numeric literals.

#### `/changelog-sheet` (`mobile/src/features/changelog/ui/changelog-sheet-screen.tsx`)
- Adds Pressable ×2 (`:41,63`) and `ThemedText` ×2 (`:51,71`) on top of `ChangelogContent` (`:76`). Raw RN total 9. `Stack.Screen` (`:59`). Tokens: `useTheme` (`:21`). Presentation: FS sheet (`mobile/src/app/_layout.tsx:156-164`).

#### `/personal-events` (`mobile/src/features/personal-events/ui/personal-events-list.tsx`)
- **Shared DS (3):** `RootPage` (`:32`), `ThemedText` ×4 (`:59,112,113,117`), `EmptyState` (`:67`). Helper: `headerScrollProps` (`:6`).
- **Feature-local (1):** `EventRow` (`:81`).
- **Raw RN (6):** FlatList ×1 (`:38`), View ×3 (`:45,106,111`), Pressable ×2 (`:47,90`).
- **Third-party:** expo-router `Link asChild` ×2 (`:46,89`), with `StyleSheet.flatten` applied to the child style (`:52-57`). `Stack.Screen` (`:31`).
- Tokens: `useTheme` (`:25,83`), 4 numeric literals.

#### `/personal-event-form` (`mobile/src/features/personal-events/ui/personal-event-form-screen.tsx`)
- Screen: `Stack.Screen` (`:23`), `RootPage` (`:31`), `PersonalEventEditor` (`:37`).
- **Feature-local (5):** `PersonalEventEditor` (`personal-event-editor.tsx`), `PersonalEventActions` (`personal-event-editor.tsx:96`), `PersonalEventFields` (`:108`), `DateTimeField` (`personal-event-fields.tsx:70,84`), `ColorSwatchPicker` (`personal-event-fields.tsx:99`).
- **Shared DS (7):** `RootPage`, `KeyboardSafeActionLayout` (`personal-event-editor.tsx:91`), `ErrorNotice` (`personal-event-actions.tsx:35`), `PrimaryAction` (`personal-event-actions.tsx:44`), `FieldError` ×2 (`personal-event-fields.tsx:63,92`), `ThemedText` (several), `DateTimePicker` from chrome (`date-time-field.tsx:52,73`).
- **Raw RN (14):** `personal-event-fields.tsx`: View ×6 (`:48,66,80,95,105,120`), TextInput ×3 (`:52,109,124`). `personal-event-actions.tsx`: View ×1 (`:33`), Pressable ×1 (`:52`). `date-time-field.tsx`: Pressable ×1 (`:63`). `color-swatch-picker.tsx`: View ×1 (`:22`), Pressable ×1 (`:26`).
- **Platform branching:** `date-time-field.tsx:50` (inline picker except on Android).
- Tokens: `useTheme` in fields, actions, swatch and date field. A few numeric literals (3 in fields, 2 in the swatch picker).

#### `/event-details/[uid]` (`mobile/src/features/calendar/ui/event-details-screen.tsx`)
Route: `mobile/src/app/event-details/[uid].tsx:6` → `mobile/src/features/calendar/ui/index.ts:3`.
- **Shared DS (3):** `RootPage` (`event-details-screen.tsx:47`, `event-details-status.tsx:47`), `ErrorNotice` (`event-details-screen.tsx:59`, and in the checklist `event-checklist.tsx:57`), `ThemedText` (e.g. `event-details-content.tsx:73`).
- **Feature-local (9):** `EventDetailsHeader` (`event-details-actions.tsx`, used at `event-details-screen.tsx:46`), `EventDetailsLoading`/`EventDetailsNotFound`/`EventDetailsStatus` (`event-details-status.tsx:14,31`), `ResolvedEventDetails` (`event-details-screen.tsx:35`), `EventDetailsContent` (`event-details-content.tsx:20`), `TitleBlock` (`:83`), `EventTags` (`:118`), `TagBubble` (`:136`), `ContentLine` (`:146`).
- **Cross-feature UI:** `EventChecklist` from `@/features/event-checklists` (`event-details-content.tsx:17`, `:78`). Inside it: View ×4, Pressable ×5 (`event-checklist.tsx:88,145,179,194,209`), TextInput ×1 (`:170`), local `ChecklistRow` (`:104`). It also reads calendar names through `@/features/calendar-sources` (`event-details-content.tsx:13`).
- **Raw RN (12 in calendar/ui):** ScrollView ×1 (`event-details-screen.tsx:53`), Pressable ×1 (`event-details-actions.tsx:102`), View ×7 (`event-details-content.tsx:47,95,96,97,124,138,148`), View ×2 + ActivityIndicator ×1 (`event-details-status.tsx:15,49,21`). The checklist adds 10 more.
- **Third-party:** `Stack.Screen` ×2 (`event-details-actions.tsx:94,98`). It also uses the RN `Alert` API (`event-details-actions.tsx:3`).
- Platform branching: none. Tokens: `Spacing`/`Radii`, and `useTheme` in the checklist (`event-checklist.tsx:34,128`). The checklist has 7 numeric literals.

#### `/user-calendars` (`mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx`)
- **Shared DS (6):** `RootPage` (`:59`), `EmptyState` (`:62`), `NativeSettingsHost` (`:72`), `NativeSettingsSection` (`:73`), `NativeSettingsRow` (`:85`), `NativeSettingsFloatingAction` (`:111`).
- **Raw RN (2):** View ×2 (`:55,61`).
- **Third-party:** `Stack.Screen` with iOS-only `unstable_headerRightItems` (an SF Symbol "add" button) (`:36-48`).
- **Platform branching:** `:40` (iOS header button; on Android the floating action is used instead).

#### `/user-calendars/[id]` (`mobile/src/features/calendar-sources/ui/user-calendar-detail-screen.tsx`)
- **Shared DS (6):** `NativeSettingsHost` ×2 (`:41,80`), `NativeSettingsAlert` (`:82`), `NativeSettingsSection` ×3 (`:89,107,119`), `NativeSettingsRow` ×3 (`:90,99,120`), `NativeSettingsSwitchRow` (`:108`), and `NativeTextEntryDialog` through the rename dialog (`rename-calendar-dialog.tsx:5`, `:103`).
- **Feature-local (1):** `RenameCalendarDialog` (`:130`).
- **Raw RN:** 0 (it uses the RN `Alert` and `AccessibilityInfo` APIs, `:4`). `Stack.Screen` ×2 (`:40,77`).

### 2.4 Onboarding and import screens

#### `/onboarding` — Welcome (`mobile/src/features/onboarding/ui/welcome-screen.tsx`)
- **Shared DS (3):** `ThemedView` (`:48`), `AdaptiveContent` (`welcome-controls.tsx:20,53`, `welcome-pages.tsx:26`), `ThemedText` (`welcome-controls.tsx:29,66,78`, `welcome-pages.tsx:51,54`).
- **Feature-local (7):** `WelcomeEntrance` (`:50`), `WelcomeSkip` (`:51`), `WelcomePager` (`:52`), `WelcomePageIndicator` (`:57`) with `IndicatorPill` (`welcome-page-indicator.tsx:91`), `WelcomeFooter` (`:61`), `WelcomePage` (`welcome-pager.tsx:30`).
- **Raw RN (7):** Pressable ×3 (`welcome-controls.tsx:22,59,71`), View ×1 (`welcome-page-indicator.tsx:81`), View ×3 (`welcome-pages.tsx:25,31,50`).
- **Third-party:** `SafeAreaView` (`:49`), `react-native-pager-view` `PagerView` (`welcome-pager.tsx:22`), reanimated `Animated.View` (`welcome-entrance.tsx:32`, `welcome-page-indicator.tsx:54`), expo-image (`welcome-pages.tsx:42`), `SymbolView` (`welcome-controls.tsx:81`).
- **Platform branching:** control height is 44 on iOS and 48 on Android (`welcome-controls.tsx:9`, `welcome-page-indicator.tsx:18`).
- Headerless (`mobile/src/app/onboarding/_layout.tsx:28`). Tokens: `useTheme` in controls, indicator and pager. 3 numeric literals in controls.

#### `/onboarding/school` (`mobile/src/features/school-selection/ui/school-picker-screen.tsx`)
- **Shared DS (6):** `RootPage` (`:109`), `PageIntro` (`:147`), `ThemedView` (`:156`), `ThemedText` (`:46`, `school-row.tsx:66`), `ErrorNotice` (`:135`), `ErrorState` (`:169`).
- **Feature-local (6):** `MissingSchoolAction` (`:25`), `SchoolRow` (`:118`), `SchoolLogo` (`school-row.tsx:62`), `ListStatus` (`:163,180,190`), `RowSeparator` (`:119`, iOS only), `StatusSymbol` (`:181,191`).
- **Raw RN (10):** Pressable ×1 (`:30`), FlatList ×1 (`:115`), ActivityIndicator ×1 (`:164`), Pressable ×1 (`school-row.tsx:20`), View ×1 (`list-status.tsx:30`), View ×2 (`row-separator.tsx:12,13`), View ×3 (`school-logo.tsx:23,35,49`).
- **Third-party:** `Stack.Screen` (`:75`), expo-image (`school-logo.tsx:42`), `SymbolView` (`school-row.tsx:68`, `status-symbol.tsx:9`).
- **Platform branching:** `:42`, `:81`, `:119`; `list-status.tsx:24`; `school-row.tsx:58,67,92` (`Platform.select`); `status-symbol.tsx:8` (returns `null` off iOS).
- **Cross-feature (non-UI):** `school-row.tsx` imports `emitExportGuideEvent` from `@/features/export-guides/ui` (`:7`) and `decideIntranetUrl`/`useImportDraft` from `@/features/onboarding` (`:8`).
- Tokens: `useTheme` used throughout.

#### `/onboarding/groups` (`mobile/src/features/school-selection/ui/school-group-picker-screen.tsx`)
- **Shared DS (5):** `RootPage` (`:64`), `ThemedText` ×5 (`:79,114,152,199,216`), `ErrorNotice` (`:90`), `ErrorState` (`:101`), `FieldError` (`:136`).
- **Feature-local (1):** `GroupNode`, which is recursive (`:124`, `:221`).
- **Raw RN (7):** ScrollView ×1 (`:72`), View ×3 (`:134,205,219`), Pressable ×3 (`:141,182,206`).
- `Stack.Screen` (`:63`). Platform: none. Tokens: `useTheme` (`:32,175`), 2 numeric literals.

#### `/onboarding/institution-name` (`mobile/src/features/onboarding/ui/institution-name-screen.tsx`)
- **Shared DS (6):** `RootPage` (`:60`), `KeyboardSafeActionLayout` (`:66`), `PrimaryAction` (`:72`), `PageIntro` (`:80`), `ThemedText` (`:82`), `FieldError` (`:114`).
- **Raw RN (1):** TextInput (`:88`). It shares a style module, `stepStyles` (`:19`), with the other onboarding steps. `Stack.Screen` (`:59`). Tokens: `useTheme` (`:36`).

#### `/onboarding/programme` (`mobile/src/features/onboarding/ui/programme-screen.tsx`)
- **Shared DS (6):** `RootPage` (`:125`), `KeyboardSafeActionLayout` (`:131`), `PrimaryAction` (`:137`), `PageIntro` (`:146`), `ThemedText` (`:117,148`), `FieldError` (`:178`).
- **Raw RN (2):** Pressable (`:109`, a header action), TextInput (`:151`).
- **Platform branching:** header options differ by platform (`:96`, `:107`). Cross-feature (non-UI): `emitExportGuideEvent` from `@/features/export-guides/ui` (`:11`).

#### `/onboarding/connect` (`mobile/src/features/onboarding/ui/connect-screen.tsx`)
- **Shared DS (3):** `RootPage` (`:55`), `PageIntro` (`:61`), `ThemedText` ×3 (`:80,103,118`).
- **Raw RN (4):** Pressable ×3 (`:64,95,107`), View ×1 (`:94`).
- **Third-party:** `SymbolView` (`:81`), `expo-web-browser` (`:3`), `Stack.Screen` (`:54`). Tokens: `useTheme` (`:38`), 4 numeric literals.

#### `/onboarding/import` (`mobile/src/features/onboarding/ui/manual-import-screen.tsx`)
- **Shared DS (3):** `RootPage` (`:38`), `PageIntro` (`:44`), `ThemedText` (`:64,93`).
- **Raw RN (2):** Pressable ×2 (`:46,69`), used as hand-built option cards. **Third-party:** `SymbolView` ×2 (`:58,87`), `Stack.Screen` (`:37`). Tokens: `useTheme` (`:29`), 2 numeric literals.

#### `/onboarding/qr-scan` (`mobile/src/features/calendar-sources/ui/qr-scan-screen.tsx`)
- The screen file chooses between views and renders no primitives itself (`:41-68`), plus `Stack.Screen` (`:73`).
- **Feature-local (10):** `QrPermissionLoadingView`, `QrPermissionRequestView`, `QrPermissionSettingsView`, `PermissionFrame` (`qr-permission-views.tsx:13,32,47`), `QrActionButton` (`qr-permission-views.tsx:34,55`), `QrScannerView`, `QrCameraFrame`, `QrImportingView`, `QrImportFailureView` (`qr-import-views.tsx`), `ImportProgressView` (`qr-import-views.tsx:38`).
- **Shared DS (7):** `RootPage` (`qr-import-views.tsx:50`, `qr-permission-views.tsx:67`, `import-progress-view.tsx:18`), `PageIntro` (`qr-permission-views.tsx:33`), `ThemedText`, `ThemedView` (`qr-import-views.tsx:85`), `AdaptiveContent` (`qr-import-views.tsx:95`), `ErrorNotice` (`qr-import-views.tsx:27`), `ErrorState` (`qr-import-views.tsx:56`).
- **Raw RN (5):** ScrollView ×1 + View ×1 (`qr-import-views.tsx:52,100`), Pressable ×1 (`qr-action-button.tsx:23`), View ×1 + ActivityIndicator ×1 (`import-progress-view.tsx:19,20`).
- **Third-party:** expo-camera `CameraView` (`qr-import-views.tsx:86`), `SafeAreaView` (`qr-import-views.tsx:94`).
- Platform: none. Tokens: `useTheme` in the camera frame and the button.

#### `/onboarding/ical-url` (`mobile/src/features/calendar-sources/ui/ical-url-screen.tsx`)
- **Shared DS (7):** `RootPage` (`:142`), `KeyboardSafeActionLayout` (`:144`), `ErrorNotice` (`:152`), `PrimaryAction` (`:167`), `PageIntro` (`:177`), `ThemedText` (`:179`), `FieldError` (`:210`).
- **Feature-local (1):** `ImportProgressView` (`:134`).
- **Raw RN (3):** TextInput (`:182`), plus View and ActivityIndicator from `ImportProgressView`. `Stack.Screen` ×2 (`:133,141`). Tokens: `useTheme` (`:55`), 2 numeric literals.

#### `/calendar-import-result` (`mobile/src/features/calendar-sources/ui/calendar-import-result-screen.tsx`)
- **Shared DS (4):** `RootPage` ×2 (`:30,51`), `ErrorState` (`:32`), `ThemedText` ×2 (`:61,64`), `PrimaryAction` (`:69`).
- **Feature-local (1):** `ImportProgressView` (`:21`).
- **Raw RN (4):** ScrollView (`:31`), View (`:56`), plus 2 from `ImportProgressView`. Headerless (`mobile/src/app/_layout.tsx:147-150`). Tokens: `Spacing`.

#### `/onboarding/export-guide/providers` (`mobile/src/features/export-guides/ui/provider-selection-screen.tsx`)
- **Shared DS (4):** `RootPage` (`:118`), `PageIntro` (`:127`), `ThemedText` ×2 (`:170,173`), and `ErrorState` through `GuideBlockingError` (`guide-status.tsx:38`).
- **Feature-local (2):** `GuideBlockingError` (`:66`), `GuideLoading` (`:86`), both in `guide-status.tsx`.
- **Raw RN (6):** FlatList (`:120`), Pressable (`:133`), View (`:169`), plus View, ActivityIndicator and ScrollView in `guide-status.tsx` (`:15,20,37`).
- **Third-party:** expo-image `Image` (`:149`), `Stack.Screen` (`:60`). Tokens: `useTheme` (`:28`), 2 numeric literals.

#### `/onboarding/export-guide/[pageIndex]` (`mobile/src/features/export-guides/ui/guide-page-screen.tsx`)
- **Shared DS (5):** `RootPage` (`:233`), `ThemedText` ×4 (`:246,247,255,290`), `PrimaryAction` (`:274`), `ErrorNotice` (`export-guide-image.tsx:39`), `ErrorState` (through `guide-status.tsx`).
- **Feature-local (4):** `GuideBlockingError` (`:176`), `GuideLoading` (`:178`), `GuidePageContent` (`:191`), `ExportGuideImage` (`:257`).
- **Raw RN (8):** ScrollView (`:240`), View (`:245`), Pressable (`:283`), View ×2 (`export-guide-image.tsx:29,31`), plus 3 in `guide-status.tsx`.
- **Third-party:** expo-image (`export-guide-image.tsx:43`), `Stack.Screen` (`:174`). Tokens: `useTheme` (`:203`).

### 2.5 Dev-only routes and redirects

#### `/dev-import` (`mobile/src/features/calendar-sources/ui/dev-import-screen.tsx`)
- Route: `mobile/src/app/dev-import.tsx:1` imports from the **top-level** feature barrel `@/features/calendar-sources`, not the `ui` sub-barrel. That barrel re-exports `DevImportScreen` (`mobile/src/features/calendar-sources/index.ts:26`) from `./ui` (`mobile/src/features/calendar-sources/ui/index.ts:2`).
- **Gate:** `isDevVariant()` (`:40`), which reads `Constants.expoConfig.extra.appVariant === "development"` (`mobile/src/config/variant.ts:14-16`). The import action returns early when not in the dev variant (`:56`), and the screen shows `devImport.unavailable` instead (`:77-84`). The route still ships in production bundles (`mobile/src/app/_layout.tsx:224-234`).
- **Shared DS (3):** `ThemedView` (`:73`), `ThemedText` ×2 (`:78,93`), `ErrorNotice` (`:86`). **Raw RN (3):** View ×2 (`:76,91`), ActivityIndicator (`:92`). **Third-party:** `SafeAreaView` (`:75`), `Stack.Screen` (`:74`).

#### `/dev-paging-spike` (`mobile/src/features/paging-spike/ui/paging-spike-screen.tsx`)
- Route: `mobile/src/app/dev-paging-spike.tsx:1` imports the top-level barrel `@/features/paging-spike` (`mobile/src/features/paging-spike/index.ts:1`).
- **Gate:** `isDevVariant()`. Outside the dev variant it renders a raw `<Text>Not available</Text>` (`:53-58`). It is reached only by deep link (`mobile/src/app/_layout.tsx:235-240`).
- **Shared DS: 0.** It uses no `ThemedText`, `ThemedView` or `useTheme`.
- **Feature-local (~16):** `PagingSpike` (`:61`), `SpikeHeader`, `SharedGrid`, `SpikePager` (`spike-chrome.tsx`), `PageWindow`, `SpikePage`, `HeaderSlot`, `NowLine`, `LiveTile`, `StaticTile`, `TileText`, `HeaderWindow`, `HourLabel`, `GridLine` (`spike-page.tsx`), `SpikePanel`, `SpikeButton` (`spike-panel.tsx`).
- **Raw RN (27):** Text ×9 (`paging-spike-screen.tsx:57`; `spike-chrome.tsx:48`; `spike-page.tsx:80,114,142,394,395`; `spike-panel.tsx:42,65`), View ×17, Pressable ×1 (`spike-panel.tsx:59`).
- **Third-party:** reanimated (`Animated.View` ×9, `Animated.ScrollView`, `Animated.Text`), `GestureDetector`, `react-native-worklets` `scheduleOnRN`, `SafeAreaView`.
- **Platform branching:** `paging-spike-screen.tsx:268,270`; `spike-panel.tsx:29`.
- **Hardcoded:** 21 hex/rgba literals (for example `#ffffff` at `paging-spike-screen.tsx:360`, `#e91e63` at `spike-page.tsx:419`, `#8e8e93` at `spike-chrome.tsx:167`, `#f2f2f7` at `spike-panel.tsx:76`).

#### `/settings-gallery` — non-production only. See [section 3](#3-settings-gallery).

#### `/profile` and `/more` (redirects)
- Both render `<Redirect href="/settings" />` (`mobile/src/app/profile.tsx:3-5`, `mobile/src/app/more.tsx:3-5`). Both are headerless in the root Stack (`mobile/src/app/_layout.tsx:138-142`). The component names (`ProfileCompatibilityRedirect`, `MoreCompatibilityRedirect`) show these exist to keep old deep links working.

## 3. settings-gallery

**What it is.** `SettingsGalleryScreen` (`mobile/src/features/settings/ui/settings-gallery-screen.tsx:23`) is a fixture screen that renders every primitive of the `NativeSettings*` chrome seam once, wired only to local `useState` (`:25-30`). It reads no data from the app. The route is a one-line re-export (`mobile/src/app/settings-gallery.tsx:1` → `mobile/src/features/settings/ui/index.ts:3`) and is registered with a default header (`mobile/src/app/_layout.tsx:153`).

**What it renders** (all from `@/components/chrome`, `:6-16`):
- `NativeSettingsHost reservesFloatingAction` (`:40`), inside a raw `View` with `flex: 1` (`:39`, `:175`).
- `NativeSettingsAlert` with a retry action that increments a counter (`:41-52`).
- `NativeSettingsHeader` with title, tagline, detail and a caption that shows the retry count (`:53-60`).
- Section "rows" with a footer (`:61-107`). It holds five `NativeSettingsRow` variants: navigation with icon, value, badge and hint (`:66-75`); plain navigation (`:76-82`); action that opens the dialog (`:83-90`); value-only (`:91-97`); navigation with subtitle (`:98-106`). The navigation rows link to `/about`.
- An untitled section with a destructive action row that counts presses (`:108-117`).
- Section "switches" with an on switch (with icon) and an off switch (`:118-132`).
- Section "choices" with two `NativeSettingsChoiceRow`s (`:133-146`).
- `NativeSettingsFloatingAction` (`:148-153`) and `NativeSettingsRadioDialog` (`:155-170`).
- All strings come from i18n keys under `settingsGallery.*`, and every element has a `settings-gallery-*` testID.

**How it is gated.** The gate is the **backend environment capability**, not `__DEV__` and not the app variant:
- `if (getBackendEnvironmentCapability() === "production") return <Redirect href="/settings" />` (`:32-34`).
- The capability comes from `Constants.expoConfig.extra.backendEnvironmentCapability` (`mobile/src/features/environment/data/runtime.ts:8-12`). It is set at build time from `process.env.BACKEND_ENVIRONMENT_CAPABILITY` (`mobile/app.config.ts:35-37`, `:235`). Valid values are `development`, `preview` and `production` (`mobile/src/config/backend-environment.ts:5-9`). Any unknown value is parsed as `production` (`mobile/src/config/backend-environment.ts:16-21`; tested in `mobile/src/config/backend-environment.test.ts:30`).
- `eas.json` sets `development`, `preview` and `production` for the three profiles (`mobile/eas.json:12`, `:26`, `:37`).
- The screen is therefore available in **development and preview builds** and redirects in production. The entry point is a row in the Settings hub's environment section, shown under the same `!== "production"` condition (`mobile/src/features/settings/ui/settings-screen.tsx:100-101`, `:171-186`). The route file still ships in production bundles; it just redirects there.
- Tests cover the production redirect and run the full render-and-interact check on both iOS and Android (`mobile/src/features/settings/ui/settings-gallery-screen.test.tsx:28-32`, `:34-80`).

**Could it seed an in-house component catalog?** Yes, for the settings-chrome family. It is already a live catalog of 9 of the chrome exports and covers their main states on both platforms. To grow into a full catalog it would need:
- **Missing chrome primitives:** `NativeSettingsNumericEditor`, `NativeTextEntryDialog`, `NativeErrorNotice`, `MenuView`, `DateTimePicker`, `GlassSurface` (all exported from `mobile/src/components/chrome/index.ts:8-57`). `Host` and `Picker` are also exported (`:32-38`) but no feature or route renders them (repo-wide count of `<Host`/`<Picker` outside `src/components/`: 0).
- **Missing non-chrome shared components:** `RootPage`/`PageIntro`, `EmptyState`, `PrimaryAction`, `KeyboardSafeActionLayout`, `ErrorNotice`/`ErrorState`/`FieldError` (`mobile/src/components/error-surfaces.tsx`), `ThemedText` type scale, `ThemedView`, `AdaptiveContent`.
- **Structure:** it is a single screen inside the `settings` feature with feature-scoped i18n keys. A broader catalog would probably sit outside any one feature and be split into pages per component family (unverified as a requirement; this is design input, not a rule).
- The capability gate is already the right shape for a catalog: visible to developers and testers in dev/preview builds, redirected in production.

There is no Storybook or other catalog in the project (`rg -il storybook mobile/package.json` returns nothing).

## 4. Observations

### Screens with the most raw primitives
1. **`/calendar`**: 19 raw elements in `ui/` plus 30 in the owned renderer, including a raw `Modal` event chooser (`mobile/src/features/calendar/renderer/owned-calendar-chooser.tsx:21`) and a raw `Text` header title with platform-specific hardcoded font sizes (`mobile/src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx:129`, `:145`). Some of this is unavoidable (custom timeline geometry). The header pill, the FAB and the agenda tiles are general-purpose controls that are built by hand.
2. **`/` Home**: 36 raw elements (25 `View`, 8 `Pressable`) across the cards, the scroller and the mini-timeline. It has hand-built pressable cards with their own 44/48 target logic and iOS press opacity, repeated in four files (`today-section.tsx:124,146`, `upcoming-section.tsx:139,159,167-168`, `today-timeline.tsx:54,212,346`, `upcoming-scroller.tsx:110,136`).
3. **`/dev-paging-spike`**: 27 raw elements, 0 shared components, no theme, 21 hex literals. It is dev-only, so it matters less.
4. **`/event-details/[uid]`**: 12 raw elements plus 10 in the cross-feature `EventChecklist`, which has its own `TextInput` and 5 `Pressable`s (`mobile/src/features/event-checklists/ui/event-checklist.tsx:88-209`).
5. **`/personal-event-form`**: 14 raw elements, including 3 raw `TextInput`s (`personal-event-fields.tsx:52,109,124`).
6. **`/onboarding/school`**: 10 raw elements, including a hand-rolled row separator and logo frame.
7. Mid-range screens that build their own list rows: `/activity` (10), `/changelog-sheet` (9), `/onboarding/export-guide/[pageIndex]` (8), `/hidden-events` (7), `/onboarding/groups` (7), `/onboarding` welcome (7).

**Repeated patterns built by hand, which are candidates for shared components:**
- **Text inputs.** Every text field is a raw `TextInput`, with no shared field component: feedback (`feedback-screen.tsx:138,174`), institution-name (`institution-name-screen.tsx:88`), programme (`programme-screen.tsx:151`), ical-url (`ical-url-screen.tsx:182`), personal-event fields ×3, and the checklist (`event-checklist.tsx:170`). Only the errors are shared, through `FieldError`.
- **Tappable list rows and cards built from `Pressable`**: activity, hidden-events, personal-events, timezone-chooser, school-row, group-node, provider-selection, manual-import, connect, home cards and agenda tiles.
- **Loading spinners from a bare `ActivityIndicator`**: activity (`:115,333`), dev-import, event-details-status, guide-status, import-progress-view, school-picker, environment-runtime-gate.

### Screens best composed of shared components
- **Fully on the chrome seam with 0 raw primitives:** `/settings`, `/about`, `/appearance-settings`, `/language-settings`, `/timezone-settings`, `/notification-settings`, `/notification-frequency`, `/notification-days-ahead`, `/notification-days-custom`, `/user-calendars/[id]`. All their platform behaviour is inside `mobile/src/components/chrome/native-settings.tsx`. `/user-calendars` (2 `View`s) and `/settings-gallery` (1 `View`) come close.
- **Best non-settings exemplars:** `/onboarding/institution-name` (6 shared components, 1 raw `TextInput`), `/onboarding/ical-url` (7 shared, 3 raw), `/feedback` (7 shared, 5 raw), `/calendar-import-result` (4 shared, 4 raw). They all follow the same pattern: `RootPage` + `PageIntro` + `KeyboardSafeActionLayout` + `PrimaryAction` + `FieldError`/`ErrorNotice`.
- **Most-used shared components** (feature/route `.tsx` files outside `src/components/` that render each one): `ThemedText` 52, `RootPage` 23, `ErrorNotice` 14, `NativeSettingsHost` 11, `NativeSettingsSection` 11, `PageIntro` 9, `NativeSettingsRow` 8, `PrimaryAction` 7, `ErrorState` 7, `EmptyState` 6, `FieldError` 6, `ThemedView` 6, `KeyboardSafeActionLayout` 5. Used once each: `GlassSurface` (Home header), `MenuView` (calendar view menu), `DateTimePicker` (personal-event form), `NativeTextEntryDialog` (rename calendar). Not used by any feature: `Host`, `Picker`, and `NativeErrorNotice` (which is used only inside chrome).

### Cross-feature UI imports
UI components imported from another feature:
- **about → settings:** `SettingsRow`, `SettingsSection` (`mobile/src/features/about/ui/about-screen.tsx:14`).
- **environment → settings:** `SettingsRow` via the deep path `@/features/settings/ui/settings-row` (`mobile/src/features/environment/ui/environment-settings-control.tsx:14`).
- **settings → environment:** `EnvironmentSettingsControl` (`mobile/src/features/settings/ui/settings-screen.tsx:14`). Together with the previous item, settings and environment import UI from each other.
- **calendar → event-checklists:** `ChecklistProgressIndicator` (`mobile/src/features/calendar/ui/agenda-list.tsx:20`, `mobile/src/features/calendar/renderer/owned-calendar-page.tsx:25`) and `EventChecklist` (`mobile/src/features/calendar/ui/event-details-content.tsx:17`).
- **home → event-checklists:** `ChecklistProgressIndicator` (`mobile/src/features/home/ui/home-screen/today-section.tsx:7`, `mobile/src/features/home/ui/today-timeline.tsx:30`, `mobile/src/features/home/ui/upcoming-scroller.tsx:11`).
- **Routes and layouts across features:** `(tabs)/_layout.tsx` mounts `ChangelogGate` (changelog) and `StartupTabsGate` (legacy-migration) (`mobile/src/app/(tabs)/_layout.tsx:2-3`). `onboarding/_layout.tsx` mounts `ImportDraftProvider` (`:4`). The onboarding stack hosts screens from four features: onboarding, school-selection, calendar-sources and export-guides.

Non-component imports through another feature's `ui` barrel: `emitExportGuideEvent` (telemetry) from `@/features/export-guides/ui`, imported by `mobile/src/features/onboarding/ui/programme-screen.tsx:11` and `mobile/src/features/school-selection/ui/school-row.tsx:7`.

`SettingsRow`/`SettingsSection` live in the settings feature, but their only consumers are other features (about, environment). The settings hub itself uses `NativeSettingsRow`/`NativeSettingsSection` directly. In practice they act as shared components stored in a feature folder.

### Platform-branching hotspots
- No platform-suffixed files exist. All branching is done with `Platform.OS` at runtime.
- Outside chrome, the most branching is in the Home subtree (about 14 sites), the Calendar header and actions (about 8 sites, plus renderer constants), and the school picker and row (about 8 sites). Most of it is the same 44-vs-48 target size and iOS press-opacity logic repeated in each file, rather than a shared token or component (e.g. `welcome-controls.tsx:9`, `welcome-page-indicator.tsx:18`, `today-timeline.tsx:54`; the same logic is inside `primary-action.tsx:49` and `error-surfaces.tsx:106`).
