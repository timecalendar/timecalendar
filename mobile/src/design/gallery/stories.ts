import type { GalleryEntry, GalleryModule, GalleryPlatform } from "./types"

export function toStoryId(metaId: string, exportName: string): string {
  const kebab = exportName
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
  return `${metaId}--${kebab}`
}

export function buildGalleryEntries(
  modules: readonly GalleryModule[],
): GalleryEntry[] {
  return modules.flatMap((module) => {
    const meta = module.default
    return meta.stories.map((exportName) => {
      const story = module[exportName] as GalleryEntry["story"]
      return {
        id: toStoryId(meta.id, exportName),
        metaId: meta.id,
        title: meta.title,
        name: story.name,
        story,
        component: meta.component as GalleryEntry["component"],
      }
    })
  })
}

export function findGalleryEntry(
  entries: readonly GalleryEntry[],
  id: string,
): GalleryEntry | undefined {
  return entries.find((entry) => entry.id === id)
}

export function isGalleryEntryAvailable(
  entry: GalleryEntry,
  platform: string,
): boolean {
  const { platforms } = entry.story
  return !platforms || platforms.includes(platform as GalleryPlatform)
}
