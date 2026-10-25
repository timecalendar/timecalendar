import { galleryModules } from "@/design/gallery/registry"
import {
  buildGalleryEntries,
  findGalleryEntry as findEntry,
} from "@/design/gallery/stories"

export { GalleryStoryContent } from "@/design/gallery/story-content"
export type {
  GalleryEntry,
  GalleryKey,
  GalleryMeta,
  GalleryModule,
  GalleryStory,
} from "@/design/gallery/types"

export const galleryEntries = buildGalleryEntries(galleryModules)

export function findGalleryEntry(id: string) {
  return findEntry(galleryEntries, id)
}
