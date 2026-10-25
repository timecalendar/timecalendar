import { Redirect, Stack, useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"

import { findGalleryEntry, GalleryStoryContent } from "@/design"

import { isDeveloperSurfaceEnabled } from "./developer-access"

export function GalleryStoryScreen() {
  const { t } = useTranslation()
  const { story } = useLocalSearchParams<{ story: string }>()

  if (!isDeveloperSurfaceEnabled()) return <Redirect href="/settings" />

  const entry = findGalleryEntry(story)
  if (!entry) return <Redirect href="/developer/gallery" />

  return (
    <>
      <Stack.Screen options={{ title: t(entry.name) }} />
      <GalleryStoryContent entry={entry} />
    </>
  )
}
