import type { GalleryEntry, GalleryModule } from "./types"

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
    // Sorted explicitly: the Babel CJS transform reorders exports, and ES module
    // namespaces sort them anyway, so source order is not observable.
    return Object.keys(module)
      .filter((exportName) => exportName !== "default")
      .sort()
      .map((exportName) => {
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
