import type { SFSymbol } from "expo-symbols"
import type { ImageSourcePropType } from "react-native"

const materialSymbols = {
  calendar_month:
    require("@/assets/icons/material/calendar_month.xml") as ImageSourcePropType,
  dns: require("@/assets/icons/material/dns.xml") as ImageSourcePropType,
  event_note:
    require("@/assets/icons/material/event_note.xml") as ImageSourcePropType,
  feedback:
    require("@/assets/icons/material/feedback.xml") as ImageSourcePropType,
  grid_view:
    require("@/assets/icons/material/grid_view.xml") as ImageSourcePropType,
  history:
    require("@/assets/icons/material/history.xml") as ImageSourcePropType,
  info: require("@/assets/icons/material/info.xml") as ImageSourcePropType,
  mail: require("@/assets/icons/material/mail.xml") as ImageSourcePropType,
  notifications:
    require("@/assets/icons/material/notifications.xml") as ImageSourcePropType,
  palette:
    require("@/assets/icons/material/palette.xml") as ImageSourcePropType,
  person: require("@/assets/icons/material/person.xml") as ImageSourcePropType,
  privacy_tip:
    require("@/assets/icons/material/privacy_tip.xml") as ImageSourcePropType,
  public: require("@/assets/icons/material/public.xml") as ImageSourcePropType,
  view_week:
    require("@/assets/icons/material/view_week.xml") as ImageSourcePropType,
  visibility_off:
    require("@/assets/icons/material/visibility_off.xml") as ImageSourcePropType,
} as const

export type NativeSettingsMaterialSymbol = keyof typeof materialSymbols

export type NativeSettingsIcon = {
  ios: SFSymbol
  android: NativeSettingsMaterialSymbol
}

export function materialSymbolSource(
  name: NativeSettingsMaterialSymbol,
): ImageSourcePropType {
  return materialSymbols[name]
}
