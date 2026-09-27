import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

export default function SettingsStackLayout() {
  const { t } = useTranslation()

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLargeTitle: true,
        title: t("settingsHub.title"),
      }}
    />
  )
}
