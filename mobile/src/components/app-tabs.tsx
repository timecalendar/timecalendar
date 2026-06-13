import { NativeTabs } from "expo-router/unstable-native-tabs"
import { useTranslation } from "react-i18next"
import { useColorScheme } from "react-native"

import { Colors } from "@/constants/theme"

export default function AppTabs() {
  const { t } = useTranslation()
  const scheme = useColorScheme()
  const colors = Colors[scheme === "unspecified" ? "light" : scheme]

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>
          {t("home.tab.label")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/home.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>
          {t("profile.tab.label")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/explore.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
