import { Host, Picker } from "@expo/ui"
import { DateTimePicker } from "@expo/ui/community/datetime-picker"
import { type MenuComponentRef, MenuView } from "@expo/ui/community/menu"

// The single import site for `@expo/ui` (SDK-56 native controls — SwiftUI on
// iOS / Jetpack Compose on Android). The chrome-boundary lint rule
// (eslint.config.js) forbids importing `@expo/ui` (+ subpaths) anywhere outside
// src/components/chrome/, so when this alpha API churns the blast radius is this
// file. Feature/route code imports `@/components/chrome`, never `@expo/ui`
// directly (ADR 010, design D4).
//
// We default to the UNIVERSAL entry (`@expo/ui` → build/universal): the same
// call site bridges to SwiftUI / Compose and renders a plain View off-device
// (web, RN fallback, Jest). Platform-specific community controls stay behind
// the same seam.
//
// CONSUMERS (the wrapper stays THIN — design D4: re-export only the controls a
// consumer needs, never force theming onto the OS-chromed controls, R-3):
//  - `Picker` (+ its static `Picker.Item`) — the value-based single-select menu
//    (A2 / TIM-131, the first @expo/ui consumer).
//  - `DateTimePicker` — the SECOND @expo/ui consumer (B2 / TIM-133), the native
//    date/time control from the `@expo/ui/community/datetime-picker` subpath.
//    IMPORTANT: this is `@expo/ui`'s OWN control — NOT
//    `@react-native-community/datetimepicker`. It renders SwiftUI's `DatePicker`
//    on iOS and Jetpack Compose date/time dialogs on Android (it only mirrors
//    the RNC public prop types for API familiarity), so it pulls in NO extra
//    package — it rides the same already-installed, autolinking `@expo/ui` and
//    the same ADR-010 universal posture as `Picker` (one library, one seam, one
//    blast radius). See ADR 012. Kept thin: no higher-level composed date-field,
//    no forced theming of the OS-chromed control (R-3).
//  - `MenuView` + `MenuComponentRef` — anchored native action menus, including
//    the calendar view trigger and per-calendar actions.
//
// These controls are not theme-tinted here: native controls adopt
// the platform's own light/dark appearance — forcing `@/theme` colors onto it
// would be the LCD laziness R-2 rejects and breaks the platform-is-the-reference
// posture (R-3). (Unlike NativeTabs, where the wrapper injects colors because
// the consumer would otherwise reach the raw Colors map.) No higher-level
// composed control is baked into the seam.

export { DateTimePicker, Host, type MenuComponentRef, MenuView, Picker }
