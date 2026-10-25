import { Redirect, Stack, useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"

import { findGalleryEntry, GalleryStoryContent } from "@/design"

import { isDeveloperSurfaceEnabled } from "./developer-access"

export function GalleryStoryScreen() {
  if (!isDeveloperSurfaceEnabled()) return <Redirect href="/settings" />
  return <GalleryStory />
}

function GalleryStory() {
  const { t } = useTranslation()
  const { story } = useLocalSearchParams<{ story: string }>()
  const entry = findGalleryEntry(story)

  if (!entry) return <Redirect href="/developer/gallery" />

  return (
    <>
      <Stack.Screen options={{ title: t(entry.name) }} />
      <GalleryStoryContent entry={entry} />
    </>
  )
}
