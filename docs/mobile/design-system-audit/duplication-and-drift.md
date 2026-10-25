# Design system audit, Phase 0: duplication and drift

Date: 2026-10-25. Scope: the UI layer of `mobile/` (Expo Router, SDK 56, RN 0.85). This is a read-only audit. No app code was changed.

The token layer is `mobile/src/theme/tokens.ts`:

- `Colors` (light and dark): text, background, backgroundElement, backgroundSelected, textSecondary, textTertiary, primary, primaryStrong, actionText, onPrimary, primarySoft, positive, informational, destructive, error, homeHero, homeHeroDate, logoSurface, separator, ripple.
- `Spacing`: half 2, one 4, two 8, three 16, four 24, five 32, six 64.
- `Radii`: small 4, medium 8, large 16, pill 9999.
- `Fonts`: per-platform font families. Nothing outside `src/theme/` uses it.
- `MaxContentWidth`: 800.

The rules being checked come from `docs/mobile/architecture-book/theming.md` and `accessibility.md`:

- Body text in brand color uses `actionText`, because `primary` (#E91E63) on white is 4.35:1, below AA for body text.
- White text on a brand fill uses `primaryStrong` with `onPrimary`.
- Header bar buttons are not pink.
- Filled body and footer actions use `PrimaryAction`.
- Generic cards have no colored leading rail.
- Event colors are data and never carry text.
- The chrome seam owns settings row tint and typography.
- The native title is the route heading.

## Method

Every count below comes from `rg`, run from `mobile/`, with tests, generated API code and test support excluded:

```sh
cd mobile
S() { rg -n --no-heading -g '!*.test.*' -g '!src/api/generated/**' -g '!src/test-support/**' -e "$1" src; }

# colors
S '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\('
S '["'"'"'](white|black|transparent|red|blue|green|gray|grey|yellow|orange|pink|purple)["'"'"']'
# spacing (numeric literals, non-zero)
S '\b(padding\w*|margin\w*|gap|rowGap|columnGap|top|bottom|left|right|start|end)\s*:\s*-?[0-9]+(\.[0-9]+)?\b|\bspacing=\{[0-9]+\}|Padding\(\{|\bpadding\([0-9]|spacedBy:\s*[0-9]'
# radius
S '\b(border\w*Radius|cornerRadius)\s*:\s*[0-9]+'
# typography
S '\b(fontSize|lineHeight|letterSpacing)\s*:\s*[0-9]+'
S 'fontWeight\s*:'
S 'fontFamily\s*:'
# shadows
S '\b(shadowColor|shadowOpacity|shadowRadius|shadowOffset|elevation|boxShadow)\s*:'
# scheme access
S 'useColorScheme|Appearance\.'
# style authoring
S 'StyleSheet\.create\('
S '(style|contentContainerStyle|containerStyle)=\{\{'
S '(style|contentContainerStyle)=\{\['
# hairline, opacity, border width
S 'hairlineWidth'
S '\bopacity\s*:\s*[0-9.]*0\.'
S '\bborder\w*Width\s*:\s*[0-9]+'
# misc
S 'hitSlop=\{[0-9]'
S '<ActivityIndicator'
S '<SymbolView'
S '<Link\b|asChild|NativeTabs\.Trigger'
S 'min(Height|Width)\s*:\s*(44|48)\b'
S 'Spacing\.'
S 'Radii\.'
# platform
S 'Platform\.OS|Platform\.select'
rg --files src | rg '\.(ios|android)\.tsx?$'
```

Before counting, matches were grouped per feature folder, and comment lines were dropped. For spacing, `src/theme/` and `*/data/` (fixtures) were excluded. For hex, `tokens.ts`, `color-swatch-presets.ts` and `calendar/data/types.ts` were excluded, since they define color data. Line numbers marked "(approx.)" were read from the file but may be one or two lines off. Files not read in full are listed at the end.

Reference counts: `Spacing.` appears 255 times and `Radii.` 60 times. So most spacing already goes through tokens, and the drift below is the exception.

---

## Part A: duplication map

Each group is one candidate primitive. Under each group, every implementation is listed with its location and how it differs.

### A1. Filled brand button (candidate: `PrimaryAction`, which already exists)

The canonical component is `mobile/src/components/primary-action.tsx:23`:

- Fill: `primaryStrong`. Label: `onPrimary`, smallBold.
- minHeight: 44 on iOS, 48 on Android.
- Pressed: Android ripple, iOS opacity 0.65.
- Disabled: 0.55. A spinner is available.
- Used by:
  - `error-surfaces.tsx:188`
  - `programme-screen.tsx:137`
  - `institution-name-screen.tsx:72`
  - `personal-event-actions.tsx:44`
  - `feedback-screen.tsx:113`
  - `calendar-import-result-screen.tsx:69`
  - `ical-url-screen.tsx:167`
  - `guide-page-screen.tsx:274`

Hand-rolled copies:

| Location | How it differs |
| --- | --- |
| `mobile/src/features/onboarding/ui/welcome-controls.tsx:59-69` | `cta` style. minHeight 48 on both platforms. No ripple and no pressed state. |
| `mobile/src/features/onboarding/ui/connect-screen.tsx:107-121` | "Continue" button. Own Pressable and style block, with a 48 minimum height. |
| `mobile/src/features/onboarding/ui/manual-import-screen.tsx:46-67` | QR button. Filled, with a leading SymbolView icon. PrimaryAction has no icon slot. |
| `mobile/src/features/changelog/ui/changelog-sheet-screen.tsx:41-54` | Pressed opacity 0.8. The label uses the default ThemedText weight, not smallBold. |
| `mobile/src/features/onboarding/ui/step-styles.ts:43-50` | `cta` style is defined but nothing uses it (dead code). |

### A2. Outlined brand button (no primitive)

These use a 2px `primary` border with brand text.

| Location | How it differs |
| --- | --- |
| `mobile/src/features/calendar-sources/ui/qr-action-button.tsx:14-54` | `backgroundElement` fill plus an icon. The only one packaged as a component. |
| `mobile/src/features/onboarding/ui/connect-screen.tsx:64-91` | Intranet link with an icon. |
| `mobile/src/features/onboarding/ui/connect-screen.tsx:95-106` | Back button. No icon. Label is `themeColor="primary"` (see B1). |
| `mobile/src/features/onboarding/ui/manual-import-screen.tsx:69-94` | Same look as the QR button, built locally. |
| `mobile/src/features/export-guides/ui/guide-page-screen.tsx:282-293` (approx.) | Back button. Label is `primary`. |
| `mobile/src/features/event-checklists/ui/event-checklist.tsx:88` (approx.) | Add-item button. borderWidth 1 instead of 2, minHeight 44 on both platforms. |

### A3. Neutral filled button (no primitive)

| Location | How it differs |
| --- | --- |
| `mobile/src/features/school-selection/ui/school-group-picker-screen.tsx:141-155` | "Confirm" uses a `backgroundSelected` fill. This is the screen's main action, but it is not a PrimaryAction. |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-status.tsx:34-50` | Refresh button. minHeight 44 on both platforms. |
| `mobile/src/features/personal-events/ui/personal-event-actions.tsx:52-64` | Delete uses a `backgroundElement` fill with `primary` text, not the `destructive` color. |
| `mobile/src/features/personal-events/ui/personal-events-list.tsx:46-62` | "Add" Link with `asChild` and a `backgroundElement` fill. |

### A4. Text button / inline link (candidate: `ErrorTextAction` generalised)

| Location | How it differs |
| --- | --- |
| `mobile/src/components/error-surfaces.tsx:81` (`ErrorTextAction`) | Uses `actionText`. Correct contrast. |
| `mobile/src/features/school-selection/ui/school-picker-screen.tsx:25-51` (`MissingSchoolAction`) | Uses `actionText`, small type. Correct. |
| `mobile/src/features/onboarding/ui/welcome-controls.tsx:22-32` | "Skip". Uses `primary`. |
| `mobile/src/features/onboarding/ui/welcome-controls.tsx:71-91` | "Next". Uses `primary`. |
| `mobile/src/features/hidden-events/ui/hidden-events-screen.tsx:172-182` | "Unhide". Uses `primary` on a `backgroundElement` card. |
| `mobile/src/features/home/ui/home-screen/upcoming-section.tsx:69-78` | "See all". Uses `primary`. |

### A5. Header actions

Three different mechanisms exist for the same job:

| Location | Mechanism |
| --- | --- |
| `mobile/src/features/settings/ui/timezone-chooser-screen.tsx:131-149` | `Stack.Toolbar.Button` (native). |
| `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx:40-52`, `mobile/src/features/school-selection/ui/school-picker-screen.tsx:80-95` | `unstable_headerRightItems` / `unstable_headerLeftItems` (native). |
| `mobile/src/features/onboarding/ui/programme-screen.tsx:107-121` | Native item on iOS, `headerRight` Pressable on Android. |
| `mobile/src/features/calendar/ui/event-details-actions.tsx:101-111` | `headerRight` Pressable with a text label on both platforms. |
| `mobile/src/features/changelog/ui/changelog-sheet-screen.tsx:62-73` | `headerRight` Pressable "Close" on both platforms. |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-actions.tsx:40-72` (`HeaderIconAction`) | Pressable plus SymbolView, tinted `primary`. This breaks the "header buttons are not pink" rule. |
| `mobile/src/features/home/ui/home-screen/home-screen-header.tsx:25-41` | GlassSurface plus SymbolView "plus", tinted `text`. Correct. |

### A6. Floating action button (candidate: one RN `Fab`)

| Location | How it differs |
| --- | --- |
| `mobile/src/features/home/ui/home-screen/home-screen-header.tsx:46-65,102-106` | `HomeAddFab`: SymbolView "add", `primary` fill, ripple, shadow. |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-actions.tsx:74-90,113-119` | `CalendarAddFab`: a "+" text glyph at fontSize 30 / lineHeight 32. No ripple. Its shadow block is identical to Home's. |
| `mobile/src/components/chrome/native-settings.tsx:282` (approx.) | `NativeSettingsFloatingAction`: native Material FAB used inside settings screens. |

The two RN FABs repeat the same shadow and size values but use different icons and press feedback. They also sit on a brand fill under the `onPrimary` rule.

### A7. List rows (candidate: the `NativeSettings` seam, plus one RN `ListRow`)

The seam is `NativeSettingsRow` / `NativeSettingsSection` in `mobile/src/components/chrome/native-settings.tsx`. There is also a second API on top of it:

- `mobile/src/features/settings/ui/settings-row.tsx:48` and `settings-section.tsx:11` are thin adapters around the seam.
- Only `mobile/src/features/about/ui/about-screen.tsx:172-180` and `mobile/src/features/environment/ui/environment-settings-control.tsx:70` use them.
- The `first` prop is never used.

Hand-built rows:

| Location | How it differs |
| --- | --- |
| `mobile/src/features/settings/ui/timezone-chooser-screen.tsx:85-114,179-187` | Hairline bottom border. Opacity press (0.65, disabled 0.45). No ripple. minHeight 64, padding `Spacing.four`. |
| `mobile/src/features/school-selection/ui/school-row.tsx:20-76` | Ripple on Android, `backgroundSelected` press on iOS. iOS-only chevron (SymbolView size 14, `textTertiary`). minHeight 56. |
| `mobile/src/features/hidden-events/ui/hidden-events-screen.tsx:148-185` | `HiddenRow`: `backgroundElement` card with `Radii.medium` and a trailing text action. |
| `mobile/src/features/activity/ui/activity-screen.tsx:227-305` | `ActivityItemRow`: card style. Pressable with no pressed feedback. |
| `mobile/src/features/personal-events/ui/personal-events-list.tsx:88-123` | `EventRow`: card with a 24px swatch. Link with `asChild`. No pressed feedback. |
| `mobile/src/features/export-guides/ui/provider-selection-screen.tsx:133-181,195` | Card with a hairline separator border, minHeight 56. No pressed feedback. |
| `mobile/src/features/school-selection/ui/school-group-picker-screen.tsx:182-217` | `GroupNode`: selection is shown only by switching between `backgroundSelected` and `backgroundElement`, with no check mark. |
| `mobile/src/features/calendar/renderer/owned-calendar-chooser.tsx:39-56` | Option rows inside a custom Modal. |

### A8. Event cards and tiles (candidate: one `EventCard` driven by `event-surface.ts`)

| Location | How it differs |
| --- | --- |
| `mobile/src/features/calendar/ui/agenda-list.tsx:186-216,200,251-254` | `EventTile`: `backgroundElement` fill with a `borderLeft` rail in `event.color` (`Spacing.half` wide). Shadow with opacity 0.06, radius 15, elevation 2. |
| `mobile/src/features/home/ui/upcoming-scroller.tsx:94-126` (approx.) | Wash from `eventSurfaceColor`. Ripple, iOS pressed opacity 0.62. No shadow and no rail. |
| `mobile/src/features/home/ui/home-screen/today-section.tsx:105-131` (approx.) | All-day card. Same wash as upcoming-scroller. |
| `mobile/src/features/home/ui/home-screen/upcoming-section.tsx:130-153` (approx.) | `NextDayCard`. |
| `mobile/src/features/home/ui/home-screen/welcome-card.tsx` | Hero card on `homeHero`. Own type scale (B4). |
| `mobile/src/features/changelog/ui/changelog-content.tsx:43-72,94` | Item card with `Radii.large`. minHeight 72 on iOS, 76 on Android. |

The calendar agenda and Home show the same event in two different visual languages: a rail plus shadow in one, a tinted wash in the other.

### A9. Section headers (candidate: a `SectionHeader` with one size)

- ThemedText `type="subtitle"` (32/44/600) is used as a section header in:
  - `mobile/src/features/hidden-events/ui/hidden-events-screen.tsx:103,122`
  - `mobile/src/features/activity/ui/activity-screen.tsx:219` (`ActivityGroupHeader`)
  - `mobile/src/features/changelog/ui/changelog-content.tsx:38`
  - `mobile/src/features/calendar/ui/agenda-list.tsx:129` (approx., `DayHeader`)
  - `mobile/src/features/calendar/renderer/owned-calendar-chooser.tsx:35`
- A local `sectionTitle` at 20/25/700 is used in:
  - `mobile/src/features/home/ui/home-screen/upcoming-section.tsx:65,164`
  - `mobile/src/features/home/ui/home-screen/today-section.tsx:141`
- Settings group labels come from the native seam.
- When the Home "Up next" section has no items, it renders `EmptyState` with `variant="section"`. Its 32px subtitle title takes the place of the 20px heading (`upcoming-section.tsx:57-63` vs `:65`), so the heading size jumps between the empty and filled states.

### A10. Separators (candidate: one `Separator` with an inset prop)

- `mobile/src/features/school-selection/ui/row-separator.tsx:9`: inset hairline, used on iOS only (`school-picker-screen.tsx:119`).
- Hairline borders drawn as row styles:
  - `timezone-chooser-screen.tsx:179`
  - `provider-selection-screen.tsx:195`
  - `mobile/src/features/home/ui/today-timeline.tsx:420`
- Calendar grid hairlines in `owned-calendar-canvas.tsx` and `owned-calendar-header.tsx` (14 hairlines in the calendar bucket). These are rendering, not list separators, and are fine.
- Hairline rings: `native-settings-header.tsx:126` (icon) and `school-logo.tsx:89`.

### A11. Empty, loading and error states

Shared components:

- `mobile/src/components/empty-state.tsx` (`EmptyState`)
- `mobile/src/components/error-surfaces.tsx` (`ErrorNotice`, `ErrorState`, `FieldError`, `ErrorTextAction`)
- `mobile/src/components/chrome/native-error-notice.tsx`
- `NativeSettingsAlert` in the seam

Feature-local copies:

| Location | What it is |
| --- | --- |
| `mobile/src/features/school-selection/ui/list-status.tsx:7` | `ListStatus`, plus `status-symbol.tsx:6`, which renders on iOS only and returns `null` on Android. |
| `mobile/src/features/calendar-sources/ui/import-progress-view.tsx:12` | Import progress, `primary` spinner. |
| `mobile/src/features/export-guides/ui/guide-status.tsx:10` | `GuideLoading`, row layout, `primary` spinner. |
| `mobile/src/features/calendar/ui/event-details-status.tsx:10,21` | Default-color spinner. |
| `mobile/src/features/calendar-sources/ui/qr-permission-views.tsx:10` | Loading state as text only. |
| `mobile/src/features/school-selection/ui/school-group-picker-screen.tsx:79-86,114-121` | Loading text with no spinner. Empty state as plain text. |
| `mobile/src/features/event-checklists/ui/event-checklist.tsx:61-67` | Empty state as plain text. |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-status.tsx:26-33` | Plain empty text plus a neutral button. |
| `mobile/src/features/settings/ui/timezone-chooser-screen.tsx:160-168` | Empty search result as plain text, not `EmptyState`. |

Spinner colors are inconsistent:

| Color | Locations |
| --- | --- |
| `primary` | `activity-screen.tsx:115`, `guide-status.tsx`, `import-progress-view.tsx` |
| Default | `school-picker-screen.tsx:164`, `event-details-status.tsx:21`, `dev-import-screen.tsx:92` |
| `textSecondary` | `environment-runtime-gate.tsx:84` |
| `actionText` | `error-surfaces.tsx` |
| `onPrimary` | `primary-action.tsx` |

### A12. Text inputs (candidate: `TextField`)

| Location | How it differs |
| --- | --- |
| `mobile/src/features/onboarding/ui/step-styles.ts:35-41` | Border 1, `backgroundSelected` stroke, fontSize 16. Used by `institution-name-screen.tsx:104` and `programme-screen.tsx:168`. |
| `mobile/src/features/feedback/ui/feedback-screen.tsx:219-226` | Same, plus its own vertical padding. fontSize 16 at `:225`. |
| `mobile/src/features/calendar-sources/ui/ical-url-screen.tsx:232-238` | Same as step-styles, redefined. Its `formContent` (approx. `:222`) duplicates `stepStyles.formContent` exactly. |
| `mobile/src/features/personal-events/ui/personal-event-fields.tsx:41-44,140-152` | `backgroundElement` fill with no border. No error border. fontSize 16 at `:145`. |
| `mobile/src/features/event-checklists/ui/event-checklist.tsx:292` (approx.) | Hairline border, padding `Spacing.two`. |

The `backgroundSelected` input stroke (#E0E1E6 on white) is roughly 1.3:1, below the 3:1 non-text contrast bar for component boundaries (unverified ratio).

### A13. Pickers and choosers

| Location | Mechanism |
| --- | --- |
| `mobile/src/features/settings/ui/appearance-settings-screen.tsx:45-55,70-83` | iOS: inline `ChoiceRow` or push to `language-settings`. Android: `NativeSettingsRadioDialog`. |
| `mobile/src/features/notifications/ui/notification-settings-screen.tsx:97-115` | iOS: push screen. Android: radio dialog. |
| `mobile/src/features/environment/ui/environment-settings-control.tsx:47-60` | `Alert.alert` used as a picker: three environments plus Cancel. That is four buttons in development builds, and Android `Alert` shows at most three (unverified at runtime). |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx:115-154` (approx.) | `MenuView` with a custom pill and a chevron drawn with CSS borders. `CalendarViewMenu` and `CalendarAndroidViewMenu` are identical apart from minimumTarget 44/48. |
| `mobile/src/features/personal-events/ui/date-time-field.tsx:50-58,72-83` | iOS: compact `datetime` picker. Android: only a `mode="date"` dialog, so the time cannot be picked on Android. |
| `mobile/src/features/personal-events/ui/color-swatch-picker.tsx` | Custom swatches with role `button` inside a `radiogroup`. |
| `mobile/src/features/calendar/renderer/owned-calendar-chooser.tsx:35-71` | Custom `Modal` with an `rgba(0,0,0,0.4)` backdrop, instead of a native action sheet or menu. |

### A14. Chips, pills, badges

| Location | What it is |
| --- | --- |
| `mobile/src/features/calendar/ui/event-details-content.tsx:136-143` (approx., `TagBubble`) | Text in the `background` color on the server-provided `tag.color`. This puts text on a data color, against the rule that event colors never carry text. |
| `mobile/src/components/chrome/native-settings-header.tsx:154-159` | Pill in `primarySoft` / `actionText`. Correct. |
| `mobile/src/features/event-checklists/ui/checklist-progress-indicator.tsx:103-108` | Progress pill. gap 1, glyph at 8/9. |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx:140-147` | View pill, paddingHorizontal 12/6. |
| `mobile/src/components/chrome/native-settings.tsx:555-566` | `SwiftBadge`: "white" on "red". This is the iOS system badge idiom and is intentional. |
| `mobile/src/features/onboarding/ui/welcome-page-indicator.tsx` | Page dots. The only page indicator in the app. |

### A15. Dots, swatches, icon tiles

- **Dots and swatches:**
  - `welcome-card.tsx:118-124`: 12px dots with a `#FFFFFF` border.
  - `personal-events-list.tsx`: `rowSwatch`, 24px, `Radii.small`.
  - `event-details-content.tsx`: swatch sized `Spacing.four`, `Radii.small`.
  - `color-swatch-picker.tsx`: 48px swatches, `Radii.medium`.
  - `agenda-list.tsx`: indicator column.
- **Icon tiles:**
  - `native-settings.tsx:495-502`: `SwiftIconTile`, 29pt, cornerRadius 7, `primaryStrong`.
  - `changelog-content.tsx:50-63`: 44px tile, `primarySoft`, `Radii.medium`.
  - `school-logo.tsx:22-31`: monogram tile on `primarySoft`.

### A16. Icons

- SymbolView is used in 11 files.
- Hand-drawn icons that bypass it:
  - `event-checklist.tsx` (approx. `:189,:204,:217`) uses unicode glyphs ↑ ↓ × as icons. A nearby comment says the app has no icon font, but expo-symbols is in use elsewhere.
  - The calendar FAB uses a "+" text glyph (`calendar-screen-actions.tsx:119`).
  - The calendar view menu chevron is drawn with CSS borders.
- Android Material icon names for the seam live in `mobile/src/components/chrome/native-settings-icons.ts`.

### A17. In-body titles that compete with the native title

The architecture book makes the native header title the route heading. These screens render a second large title in the body:

- `mobile/src/features/export-guides/ui/guide-page-screen.tsx:246` (approx.): `type="title"`, 48px.
- `mobile/src/features/calendar/ui/event-details-content.tsx:101` (approx.): `TitleBlock`, 48px.
- `mobile/src/features/export-guides/ui/provider-selection-screen.tsx`: `PageIntro` with a title (32px subtitle).

---

## Part B: token drift per feature

### B0. Summary table

Feature folder under `mobile/src/features/` unless marked. `paging-spike` is a dev-only route (`mobile/src/app/dev-paging-spike.tsx`, registered at `mobile/src/app/_layout.tsx:238`) and is listed separately.

| Bucket | hex/rgb | named | spacing lit. | radius lit. | size/lh/ls | weight | family | shadow | RN `useColorScheme` | `StyleSheet.create` | inline `style={{` | style arrays | hairline | opacity lit. | borderWidth lit. |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| activity | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 4 | 0 | 0 | 0 |
| app (routes) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| calendar | 3 | 0 | 11 | 7 | 5 | 5 | 0 | 10 | 0 | 16 | 3 | 46 | 14 | 1 | 7 |
| calendar-sources | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 8 | 0 | 5 | 0 | 0 | 3 |
| changelog | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 2 | 1 | 3 | 0 | 1 | 0 |
| components (shared) | 0 | 0 | 0 | 0 | 16 | 8 | 0 | 0 | 0 | 7 | 1 | 12 | 0 | 3 | 0 |
| components/chrome | 0 | 2 | 15 | 2 | 8 | 4 | 0 | 0 | 0 | 4 | 12 | 3 | 1 | 0 | 0 |
| environment | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 |
| event-checklists | 0 | 1 | 1 | 0 | 2 | 0 | 0 | 0 | 0 | 2 | 0 | 6 | 1 | 0 | 3 |
| export-guides | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 6 | 1 | 0 | 1 |
| feedback | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 2 | 0 | 0 | 1 |
| hidden-events | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 2 | 0 | 0 | 0 |
| home | 2 | 0 | 2 | 0 | 5 | 4 | 0 | 5 | 0 | 7 | 0 | 14 | 1 | 4 | 1 |
| onboarding | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 11 | 0 | 12 | 0 | 0 | 4 |
| personal-events | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 6 | 0 | 6 | 0 | 0 | 2 |
| school-selection | 0 | 0 | 2 | 0 | 2 | 3 | 0 | 0 | 0 | 6 | 0 | 10 | 2 | 0 | 0 |
| settings | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 2 | 0 |
| splash | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 |
| paging-spike (dev) | 21 | 0 | 8 | 5 | 7 | 2 | 0 | 0 | 0 | 4 | 1 | 23 | 4 | 0 | 1 |
| **Total** | **26** | **4** | **39** | **14** | **49** | **27** | **0** | **15** | **0** | **85** | **19** | **156** | **25** | **11** | **23** |

How to read the table:

- **components (shared), 16 font sizes.** Most of these are ThemedText's own type ramp (`mobile/src/components/themed-text.tsx`), which is the definition, not drift.
- **components/chrome, 12 inline styles.** These are mostly `@expo/ui` Compose/SwiftUI typography and modifier objects, which have no StyleSheet equivalent.
- **school-selection, 2 spacing literals.** These are the intentional -1 logo overshoot.
- **No direct `useColorScheme`.** No file imports `useColorScheme` or `Appearance` from `react-native` apart from the seam itself (`mobile/src/hooks/use-color-scheme.ts:1`). This holds by convention only. `mobile/eslint.config.js` has no `no-restricted-imports` entry for it.

### B1. Colors

**Legitimate color literals:**

- `mobile/src/theme/tokens.ts`: the palette itself.
- `mobile/src/features/personal-events/ui/color-swatch-presets.ts:4-11`: eight user-selectable event colors (data).
- `mobile/src/features/calendar/data/types.ts:46`: `CALENDAR_EVENT_FALLBACK_COLOR` "#64748B" (data).
- `"transparent"` in `event-checklist.tsx:155` and `color-swatch-picker.tsx:61`.
- `native-settings.tsx:560,562`: "white" on "red" for the iOS system badge.

**Drift (production code):**

| Location | Value | Note |
| --- | --- | --- |
| `mobile/src/features/calendar/ui/agenda-list.tsx:200` | `shadowColor: "#000000"` | No shadow token exists. |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-actions.tsx:113` | `shadowColor: "#000000"` | Same value as Home's FAB. |
| `mobile/src/features/home/ui/home-screen/home-screen-header.tsx:103` | `shadowColor: "#000000"` | |
| `mobile/src/features/calendar/renderer/owned-calendar-chooser.tsx:68` | `rgba(0, 0, 0, 0.4)` | Modal backdrop. No scrim token. |
| `mobile/src/features/home/ui/home-screen/welcome-card.tsx:123` | `borderColor: "#FFFFFF"` | Dot ring stays white in dark mode. |

**Drift (dev spike only, 21 hits):**

- `mobile/src/features/paging-spike/ui/spike-panel.tsx:75,76,84,88,89`
- `spike-chrome.tsx:164,167`
- `spike-page.tsx:406,407,409,416,418,419,425,427,451,458,459,460`
- `paging-spike-screen.tsx:360,363`

**Wrong token for the job: brand `primary` used for body or label text.** `primary` is #E91E63, which gives 4.35:1 on white, and less on `backgroundElement`. It should be `actionText`:

- `mobile/src/features/onboarding/ui/connect-screen.tsx:103`
- `mobile/src/features/onboarding/ui/welcome-controls.tsx:29,78`
- `mobile/src/features/hidden-events/ui/hidden-events-screen.tsx:179` (on `backgroundElement`)
- `mobile/src/features/event-checklists/ui/event-checklist.tsx:96`, plus arrow glyphs at approx. `:189,:204`
- `mobile/src/features/export-guides/ui/guide-page-screen.tsx:290`
- `mobile/src/features/home/ui/home-screen/upcoming-section.tsx:75`
- `mobile/src/features/personal-events/ui/personal-event-actions.tsx:61` (on `backgroundElement`)

`school-logo.tsx:27` (monogram) is decorative, so it is acceptable. Only `error-surfaces.tsx`, `native-settings-header.tsx` and `school-picker-screen.tsx:46` use `actionText` correctly.

**Other color misuse:**

- `calendar-screen-actions.tsx:40-72` tints header icons `primary`. Header buttons should use `text`.
- `event-details-content.tsx:136-143` (approx.) puts `background`-colored text on `tag.color`, a data color.
- `mobile/src/features/calendar/renderer/owned-calendar-header.tsx:139-141` chooses between `text` and `textSecondary` per color scheme at the call site, instead of using one semantic token.

### B2. Spacing literals

Values that already equal a token: 2 is `half`, 4 is `one`, 8 is `two`, 16 is `three`, 24 is `four`, 32 is `five`, 64 is `six`. No token exists for 1, 3, 6, 7, 12, 20, 96 or 112.

| Location | Value | Token match |
| --- | --- | --- |
| `mobile/src/components/chrome/native-settings-header.tsx:156` | paddingHorizontal 12 | none |
| `mobile/src/components/chrome/native-text-entry-dialog-android.tsx:67` | spacedBy 12 | none |
| `mobile/src/components/chrome/native-text-entry-dialog-ios.tsx:89` | padding horizontal 16, top 12 | 16 = three; 12 none |
| `mobile/src/components/chrome/native-settings.tsx:385,548,584,617` | SwiftUI `spacing={12}` | none |
| `mobile/src/components/chrome/native-settings.tsx:394` | spacing 4 | one |
| `mobile/src/components/chrome/native-settings.tsx:532` | spacing 2 | half |
| `mobile/src/components/chrome/native-settings.tsx:587` | spacing 6 | none |
| `mobile/src/components/chrome/native-settings.tsx:561` | badge padding 7/2 | 2 = half |
| `mobile/src/components/chrome/native-settings.tsx:740` | Compose spacedBy 8 | two |
| `mobile/src/components/chrome/native-settings.tsx:945` | padding(16,0,0,0) | three |
| `mobile/src/components/chrome/native-settings.tsx:967` | FAB right/bottom 16 | three |
| `mobile/src/components/chrome/native-settings.tsx:341` | padding(LIST_INSET, 24, LIST_INSET, 8) | 24 = four, 8 = two |
| `mobile/src/components/chrome/native-settings.tsx:360` | padding 8 | two |
| `mobile/src/features/event-checklists/ui/checklist-progress-indicator.tsx:103` | gap 1 | none |
| `mobile/src/features/home/ui/home-screen.tsx:120` | Android paddingBottom 96 | none (FAB clearance) |
| `mobile/src/features/home/ui/home-screen.tsx:121` | iOS paddingBottom 112 | none (tab bar clearance) |
| `mobile/src/features/calendar/renderer/owned-calendar-canvas.tsx:375` | right 6 | none |
| `mobile/src/features/calendar/renderer/owned-calendar-chooser.tsx:67` | padding 24 | four |
| `mobile/src/features/calendar/renderer/owned-calendar-chooser.tsx:70` | padding 16, gap 8 | three, two |
| `mobile/src/features/calendar/renderer/owned-calendar-chooser.tsx:71` | padding 8 | two |
| `mobile/src/features/calendar/renderer/owned-calendar-page.tsx:688,689,715,718` | padding 4 / 2 | one / half |
| `mobile/src/features/calendar/renderer/owned-calendar-header.tsx:249` | paddingVertical 4 | one |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx:140` | paddingHorizontal 12 | none |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx:147` | paddingHorizontal 6 | none |
| `mobile/src/features/changelog/ui/changelog-sheet-screen.tsx:67` | `hitSlop={12}` | none. Every other hitSlop uses `Spacing`. |
| `mobile/src/features/paging-spike/ui/spike-panel.tsx:72,73,78,82,89`, `spike-page.tsx:444,445,452` | various | dev only |

`native-settings.tsx` also declares named layout constants: `OUTER_RADIUS` 20, `INNER_RADIUS` 4, `SEGMENT_GAP` 2, `LIST_INSET` 16, `LIST_BOTTOM_PADDING` 24, `FAB_CLEARANCE` 88. These are named on purpose to match platform metrics, but 2, 4, 16 and 24 duplicate existing tokens. Also, `FAB_CLEARANCE` (88) and Home's 96 are two different answers to the same FAB clearance question.

12 is the most common missing step: it appears at eight sites.

### B3. Radius literals

| Location | Value | Token match |
| --- | --- | --- |
| `mobile/src/components/chrome/native-settings-header.tsx:130` | borderRadius 20 | none (iOS app-icon rounding) |
| `mobile/src/components/chrome/native-settings.tsx:502` | cornerRadius 7 | none (iOS settings icon tile) |
| `mobile/src/features/calendar/renderer/owned-calendar-page.tsx:687,695,696,705,706` | 2 | none (Radii.small is 4) |
| `mobile/src/features/calendar/renderer/owned-calendar-header.tsx:269` | 16 | `Radii.large` |
| `mobile/src/features/calendar/renderer/owned-calendar-chooser.tsx:70` | 12 | none |
| `mobile/src/features/paging-spike/ui/spike-panel.tsx:83` | 8 | `Radii.medium` (dev) |
| `mobile/src/features/paging-spike/ui/spike-page.tsx:432,433,438,439` | 4 | `Radii.small` (dev) |

Computed radii (`width / 2` for circles) are not drift.

### B4. Typography

The ThemedText ramp in `mobile/src/components/themed-text.tsx` (size/lineHeight/weight):

| Type | Values |
| --- | --- |
| title | 48/52/600 |
| subtitle | 32/44/600 |
| default | 16/24/500 |
| small | 14/20/500 |
| smallBold | 14/20/700 |
| caption | 12/14/600 |
| captionSmall | 11/13/400 |

There is no step between 16 and 32, so features fill the gap themselves:

| Location | Value | Note |
| --- | --- | --- |
| `mobile/src/components/error-surfaces.tsx:198-200` | 20/28/600 | Error title |
| `mobile/src/components/chrome/native-settings-header.tsx:137-163` | 28/34/700, 17/22/400, 15/20/400, 13/18/600 | iOS Large Title / Body / Subhead / Footnote metrics. Intentional, but local. |
| `mobile/src/features/home/ui/home-screen/upcoming-section.tsx:164` | 20/25/700 | `sectionTitle` |
| `mobile/src/features/home/ui/home-screen/today-section.tsx:141` | 20/25/700 | Duplicate of the line above |
| `mobile/src/features/home/ui/home-screen/welcome-card.tsx:108-109` | 30/36/700, letterSpacing 0.6 | Hero |
| `mobile/src/features/home/ui/home-screen/home-screen-header.tsx:81` | 21/28/700 | App name lockup |
| `mobile/src/features/school-selection/ui/school-row.tsx:92-95` | iOS 17/22/400 via `Platform.select` | iOS Body metrics. Intentional. |
| `mobile/src/features/school-selection/ui/school-logo.tsx:60-61` | 17/600 | Monogram |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-actions.tsx:119` | 30/32 | FAB "+" glyph |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx:145-146` | iOS 17, Android 20, weight 600 | Platform title metrics. Intentional. |
| `mobile/src/features/calendar/renderer/owned-calendar-header.tsx:235,253-255,260-261` | various | Calendar grid labels |
| `mobile/src/features/calendar/renderer/owned-calendar-page.tsx:719` | event block text | Calendar rendering |
| `mobile/src/features/event-checklists/ui/checklist-progress-indicator.tsx:107-108` | 8/9 | Tiny glyph, below any readable size |
| `mobile/src/features/changelog/ui/changelog-content.tsx:111` | fontWeight 700 | Weight override on a ramp type |

Two more patterns:

- **TextInput fontSize 16** is hardcoded at four sites, each equal to `default` but none referencing it:
  - `onboarding/ui/step-styles.ts:40`
  - `feedback/ui/feedback-screen.tsx:225`
  - `personal-events/ui/personal-event-fields.tsx:145`
  - `calendar-sources/ui/ical-url-screen.tsx:237`
- **No fontFamily anywhere.** No feature sets `fontFamily`, and the `Fonts` token is unused, so every screen uses the system font. This is consistent, but it makes `Fonts` dead.

### B5. Shadows and elevation

15 lines, all in three places, with no shadow token:

- `mobile/src/features/home/ui/home-screen/home-screen-header.tsx:102-106`: FAB.
- `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-actions.tsx:113-117`: FAB, with values identical to Home's.
- `mobile/src/features/calendar/ui/agenda-list.tsx:200,251-254`: event tile (opacity 0.06, radius 15, elevation 2). No other card in the app has a shadow.

### B6. Direct `useColorScheme` / `Appearance`

There are 0 direct uses outside the seam `mobile/src/hooks/use-color-scheme.ts`. No lint rule enforces this (see B0).

### B7. `StyleSheet.create` vs inline styles

- 85 `StyleSheet.create` blocks, 19 inline `style={{` objects and 156 style arrays.
- 12 of the inline objects are `@expo/ui` modifiers in chrome, where inline is the only option.
- The rest are small one-offs:
  - calendar: 3
  - activity: 1
  - changelog: 1
  - components: 1
  - paging-spike: 1
- Authoring style is consistent. Not a priority.

### B8. Hairlines, opacity, border widths

- **25 hairlines.** 14 are calendar grid lines. The rest are separators and rings (A10).
- **Opacity literals.** Pressed and disabled feedback uses five different values:

  | Value | Use | Locations |
  | --- | --- | --- |
  | 0.62 | iOS pressed (Home) | `upcoming-section.tsx:178`, `today-timeline.tsx:445`, `upcoming-scroller.tsx:142`, `today-section.tsx:152` |
  | 0.65 | Pressed | `primary-action.tsx:88`, `timezone-chooser-screen.tsx:186` |
  | 0.8 | Pressed | `changelog-sheet-screen.tsx:47` |
  | 0.55 | Disabled | `primary-action.tsx:90`, `error-surfaces.tsx:107` |
  | 0.45 | Disabled | `timezone-chooser-screen.tsx:187` |

  `owned-calendar-canvas.tsx:391` uses 0.5 for rendering. Several other Pressables give no press feedback at all (A7).
- **23 borderWidth literals.**
  - Outlined buttons use 2 (A2).
  - Inputs and the checklist add button use 1 (A12).
  - Calendar rendering uses various widths.
  - There is no border-width token.

### B9. `Link asChild` / `NativeTabs.Trigger` style arrays

Everything complies:

- `mobile/src/features/personal-events/ui/personal-events-list.tsx:46,89`: both `Link asChild` children pass `StyleSheet.flatten(...)` (lines 54 and 101). The inner swatch `View` (approx. `:106`) uses an array, but it is not the Slot child, so that is safe.
- `mobile/src/components/app-tabs.tsx:10,20,27`: the `NativeTabs.Trigger` children are `Label` / `Icon` with no `style` prop.
- There are no other `Link` uses in `src/`.

---

## Part C: platform parity

### C1. Inventory

Platform-suffixed files: `mobile/src/components/chrome/native-text-entry-dialog-ios.tsx` and `native-text-entry-dialog-android.tsx`. They are named with `-ios` / `-android` and selected at runtime in `native-text-entry-dialog.tsx`; no `.ios.tsx` / `.android.tsx` resolver files exist.

**Intentional branches** (platform idiom, correct):

| Location | Branch |
| --- | --- |
| `mobile/src/features/home/ui/home-screen.tsx:102`, `home-screen-header.tsx:25` | iOS header "+" vs Android FAB |
| `mobile/src/features/calendar/ui/calendar-screen.tsx:225`, `calendar-screen-actions.tsx:28` | Same split for Calendar |
| `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx:40,111` | iOS header item vs Android FAB |
| `mobile/src/features/settings/ui/appearance-settings-screen.tsx`, `mobile/src/features/notifications/ui/notification-settings-screen.tsx:97-115` | iOS push or inline list vs Android radio dialog |
| `mobile/src/features/onboarding/ui/programme-screen.tsx:107-121` | Skip: iOS native header item vs Android Pressable |
| `mobile/src/features/school-selection/ui/school-picker-screen.tsx:80,119` | iOS back item; iOS-only inset separators |
| `mobile/src/features/settings/ui/timezone-chooser-screen.tsx:30-36,130-150` | iOS 26+ bottom toolbar search |
| `primary-action.tsx:49`, `error-surfaces.tsx:106`, `welcome-controls.tsx:9`, `welcome-page-indicator.tsx:18`, `calendar-screen-actions.tsx:99`, `upcoming-section.tsx`, `today-section.tsx`, `upcoming-scroller.tsx`, `calendar-view-menu.tsx` | Minimum touch target 44 (iOS) / 48 (Android). 36 `minHeight/minWidth` 44/48 hits in total. |
| `mobile/src/components/chrome/native-settings-header.tsx:55,85-114` | iOS rounded square vs Android circle icon |
| `mobile/src/features/school-selection/ui/school-row.tsx:67,92` | iOS chevron and 17pt body |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-header.tsx:145` | Title 17 (iOS) / 20 (Android) |
| `mobile/src/app/_layout.tsx:160,174,212` | `formSheet` (iOS) vs `fullScreenModal` (Android) for changelog-sheet, timezone-chooser, notification-days-custom |
| `mobile/src/components/chrome/native-text-entry-dialog-ios.tsx` / `-android.tsx`, `native-error-notice.tsx:29`, `native-settings.tsx` internals | SwiftUI Form vs Compose implementation. This is the point of the seam. |
| Home cards, `school-row.tsx` | Android ripple vs iOS pressed opacity or background |
| `mobile/src/components/error-surfaces.tsx` | Android-only live region; iOS uses an announcement. Equivalent behavior. |

**Accidental or suspicious branches:**

| Location | Issue |
| --- | --- |
| `mobile/src/features/personal-events/ui/date-time-field.tsx:72-83` | Android opens only a `mode="date"` dialog. Users cannot set an event time on Android, while iOS has a full `datetime` picker. Functional parity gap. |
| `mobile/src/features/school-selection/ui/status-symbol.tsx:6` | Returns `null` on Android, so Android empty and error states in school selection have no visual. No Material icon fallback. |
| `mobile/src/features/changelog/ui/changelog-content.tsx:94` | Card minHeight 72 / 76. Neither value is a platform metric, and the 4px difference has no obvious reason. |
| `mobile/src/features/home/ui/home-screen.tsx:120-121` | Bottom padding 96 / 112 as magic numbers. The seam's `FAB_CLEARANCE` is 88. |
| `welcome-controls.tsx:59-69`, `connect-screen.tsx`, `manual-import-screen.tsx` | Use minHeight 48 on iOS too, while `PrimaryAction` uses 44. This is a platform branch they skip. |
| `mobile/src/features/calendar/ui/event-details-actions.tsx:101-111`, `mobile/src/features/changelog/ui/changelog-sheet-screen.tsx:62-73` | Custom header Pressables on iOS, where sibling screens use native header items (A5). |
| `mobile/src/features/environment/ui/environment-settings-control.tsx:47-60` | `Alert.alert` picker with four buttons in development builds. On Android, `Alert` shows at most three, so one option may be dropped (unverified). |
| `mobile/src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx` | Two components (`CalendarViewMenu`, `CalendarAndroidViewMenu`) that differ only in their 44/48 target. One component with `Platform.select` would do. |

### C2. Screens that should branch but do not

These screens draw their own RN list while their siblings use the `NativeSettings` seam (SwiftUI Form / Compose list). So they look and feel different from the screens next to them on both platforms:

- **`mobile/src/features/settings/ui/timezone-chooser-screen.tsx`**: custom rows. Its parent `timezone-settings-screen.tsx` uses the seam.
- **`mobile/src/features/hidden-events/ui/hidden-events-screen.tsx`**: card rows plus `ErrorNotice`. Its sibling `user-calendars-screen.tsx` uses the seam and `NativeSettingsAlert`.
- **`mobile/src/features/activity/ui/activity-screen.tsx`** and **`mobile/src/features/personal-events/ui/personal-events-list.tsx`**: Settings-hub destinations rendered as RN cards.
- **`mobile/src/features/school-selection/ui/school-group-picker-screen.tsx`**: a tree picker with no native selection affordance.
- **`mobile/src/features/calendar/renderer/owned-calendar-chooser.tsx`**: a custom `Modal`, where iOS expects an action sheet or menu and Android a dialog or bottom sheet.
- **`mobile/src/features/environment/ui/environment-settings-control.tsx`**: an `Alert` picker, while every other single-choice setting uses `NativeSettingsRadioDialog` on Android.

---

## Top drift findings ranked by impact

1. **Brand-pink body text fails AA.** Eight production sites render labels in `primary` (4.35:1 on white, lower on `backgroundElement`) instead of `actionText`: connect, welcome controls, hidden events, checklist, guide page, Home "See all", and personal-event delete (B1). This is an accessibility defect in user-facing copy.
2. **Personal events cannot set a time on Android.** `date-time-field.tsx:72-83` only opens a date dialog (C1). This is a functional parity bug, not styling.
3. **Filled CTAs bypass `PrimaryAction`.** Four live copies (welcome, connect, manual import, changelog sheet) and one dead copy (`step-styles.ts:43-50`). They differ in min height, press feedback and label weight (A1).
4. **No primitives for the other button families.** Outlined (6 copies), neutral filled (4), text (6, of which 4 use the wrong color), header actions (3 mechanisms) and two different RN FABs (A2-A6). Most of the 23 `borderWidth` literals and all FAB shadows come from this.
5. **Type ramp has no mid-size heading.** Features invent 20/25/700, 20/28/600, 21/28/700, 30/36/700 and 28/34/700, or use 32px `subtitle` as a section header. This makes Home's "Up next" heading jump from 20 to 32 px when the list is empty (A9, B4).
6. **Settings-hub screens skip the native seam.** Timezone chooser, hidden events, activity, personal events, group picker, the calendar chooser Modal and the environment Alert each use custom rows or dialogs next to seam-based siblings. Two row APIs also coexist (`SettingsRow` adapter vs `NativeSettingsRow`) (A7, C2).
7. **Event color used as a text background, and two event-card languages.** `TagBubble` puts text on server `tag.color`. The agenda uses a color rail plus the app's only card shadow, while Home uses a tinted wash (A8, A14).
8. **Calendar header icons are pink.** `HeaderIconAction` tints `primary`, against the "header buttons are not pink" rule. Home's equivalent button correctly uses `text` (A5).
9. **Loading, empty and error states vary by feature.** Nine local variants, spinners in five different colors, and `StatusSymbol` hides all status imagery on Android (A11, C1).
10. **Interaction-state and spacing numbers have no tokens.** Five pressed/disabled opacities (0.45, 0.55, 0.62, 0.65, 0.8) and several Pressables with no press feedback. 12 is used as a spacing step at eight sites. Bottom-clearance values disagree (88 / 96 / 112). Shadows use raw `#000000`, and the backdrop uses a raw `rgba(0,0,0,0.4)` (B1, B2, B8).

What is already clean:

- Hex drift in production code is limited to five lines.
- No direct `useColorScheme` imports, though no lint rule backs this.
- Every `Link asChild` and `NativeTabs.Trigger` complies with the flatten rule.
- No `fontFamily` overrides.
- `Spacing.` and `Radii.` are referenced 315 times, against 53 numeric spacing and radius literals.

## Coverage notes

These files were scanned by `rg` but not read in full, so they could hide duplication not listed above (unverified):

- `mobile/src/features/calendar-sources/ui/`:
  - `rename-calendar-dialog.tsx`
  - `calendar-import-result-screen.tsx`
  - `dev-import-screen.tsx`
  - `qr-scan-screen.tsx`
- `mobile/src/features/settings/ui/settings-gallery-screen.tsx`
- `mobile/src/features/splash/ui/splash-screen.tsx`
- `mobile/src/features/environment/ui/environment-runtime-gate.tsx`
- `mobile/src/features/home/ui/today-timeline.tsx`
- `mobile/src/features/calendar/renderer/`:
  - `owned-calendar-page.tsx`
  - `owned-calendar-canvas.tsx`
- `mobile/src/features/calendar/ui/calendar-agenda-pane.tsx`
- `mobile/src/features/personal-events/ui/`:
  - `personal-event-editor.tsx`
  - `personal-event-form-screen.tsx`
- The body of `mobile/src/components/chrome/native-settings.tsx`, beyond the lines cited.
- The `paging-spike` feature.

Contrast ratios other than `primary` on white (4.35:1) were estimated, not measured.
