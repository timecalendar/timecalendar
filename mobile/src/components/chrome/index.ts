// Native-chrome wrapper seam. Each module under src/components/chrome/ is the
// single import site for one alpha native-chrome API; the chrome-boundary lint
// rule (eslint.config.js) forbids importing those APIs anywhere else. Feature
// and route code imports `@/components/chrome`, never the alpha packages — when
// they churn (they're all alpha), the blast radius is this directory. This is
// the roadmap step-10 insurance against alpha churn.

export {
  buildCalendarTheme,
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  type EventItem,
} from "@/components/chrome/calendar-kit"
export { GlassSurface } from "@/components/chrome/glass-surface"
export { NativeTabs } from "@/components/chrome/native-tabs"

// @expo/ui — wrapper landed (A2 / TIM-131). The Settings screen is the first
// `@expo/ui` consumer (discharging the theming-D6 deferral), so the boundary-only
// note became a real wrapper body: `expo-ui.tsx` is the single import site for
// `@expo/ui` (the universal `Host` + `Picker`), enforced by the chrome lint
// boundary. The wrapper stays thin — only the controls a consumer needs are
// re-exported; the OS-chromed picker is not force-themed (ADR 010, design D4).
//
// Second consumer (B2 / TIM-133): `DateTimePicker`, the native date/time control
// from the `@expo/ui/community/datetime-picker` subpath — `@expo/ui`'s OWN
// SwiftUI/Compose control, NOT `@react-native-community/datetimepicker` (it only
// mirrors the RNC prop types), so no new dependency. Same wrapper, same ADR-010
// universal posture; the control choice is recorded in ADR 012.
export { DateTimePicker, Host, Picker } from "@/components/chrome/expo-ui"
