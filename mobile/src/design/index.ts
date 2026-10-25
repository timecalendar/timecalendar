import { Platform } from "react-native"

import { galleryModules } from "@/design/gallery/registry"
import {
  buildGalleryEntries,
  findGalleryEntry as findEntry,
  isGalleryEntryAvailable,
} from "@/design/gallery/stories"
import type { GalleryEntry } from "@/design/gallery/types"

export { GalleryStoryContent } from "@/design/gallery/story-content"
export type {
  GalleryEntry,
  GalleryKey,
  GalleryMeta,
  GalleryModule,
  GalleryPlatform,
  GalleryStory,
} from "@/design/gallery/types"

export const galleryEntries = buildGalleryEntries(galleryModules)

export function availableGalleryEntries(): GalleryEntry[] {
  return galleryEntries.filter((entry) =>
    isGalleryEntryAvailable(entry, Platform.OS),
  )
}

export function findGalleryEntry(id: string) {
  return findEntry(availableGalleryEntries(), id)
}
