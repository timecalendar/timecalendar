import { Redirect, Stack, useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"

import { findGalleryEntry, GalleryStoryContent } from "@/design"

import { isDeveloperSurfaceEnabled } from "./developer-access"
import { useGalleryIndexAnchor } from "./gallery-anchor"

export function GalleryStoryScreen() {
  const { t } = useTranslation()
  const { story } = useLocalSearchParams<{ story: string }>()

  const enabled = isDeveloperSurfaceEnabled()
  const entry = enabled ? findGalleryEntry(story) : undefined
  useGalleryIndexAnchor(entry !== undefined)

  if (!enabled) return <Redirect href="/settings" />
  if (!entry) return <Redirect href="/developer/gallery" />

  return (
    <>
      <Stack.Screen options={{ title: t(entry.name) }} />
      <GalleryStoryContent entry={entry} />
    </>
  )
}
