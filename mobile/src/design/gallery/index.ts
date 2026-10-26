import { Platform } from "react-native"

import { galleryModules } from "./registry"
import {
  buildGalleryEntries,
  findGalleryEntry as findEntry,
  isGalleryEntryAvailable,
} from "./stories"
import type { GalleryEntry } from "./types"

export { GalleryStoryContent } from "./story-content"
export type {
  GalleryEntry,
  GalleryKey,
  GalleryMeta,
  GalleryModule,
  GalleryPlatform,
  GalleryStory,
} from "./types"

export const galleryEntries = buildGalleryEntries(galleryModules)

export function availableGalleryEntries(): GalleryEntry[] {
  return galleryEntries.filter((entry) =>
    isGalleryEntryAvailable(entry, Platform.OS),
  )
}

export function findGalleryEntry(id: string) {
  return findEntry(availableGalleryEntries(), id)
}
