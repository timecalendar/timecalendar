import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { getAllChangelogReleases } from "@/features/changelog/data"

import { ChangelogContent } from "./changelog-content"

export function ChangelogHistoryScreen() {
  const { t } = useTranslation()
  return (
    <>
      <Stack.Screen options={{ title: t("changelog.history.title") }} />
      <ChangelogContent releases={getAllChangelogReleases()} />
    </>
  )
}
