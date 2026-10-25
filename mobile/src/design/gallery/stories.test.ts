import { buildGalleryEntries, findGalleryEntry, toStoryId } from "./stories"
import type { GalleryModule } from "./types"

const Sample = () => null
const Other = () => null

const first: GalleryModule = {
  default: { id: "sample", title: "gallery.title", component: Sample },
  Switches: { name: "gallery.nativeSettings.story.switches", args: {} },
  LongStrings: {
    name: "gallery.nativeSettings.story.longStrings",
    render: () => null,
  },
}

const second: GalleryModule = {
  default: {
    id: "other",
    title: "gallery.nativeSettings.title",
    component: Other,
  },
  Default: { name: "gallery.textEntryDialog.story.default", args: {} },
}

describe("toStoryId", () => {
  it.each([
    ["Rows", "native-settings--rows"],
    ["LongStrings", "native-settings--long-strings"],
    ["HeaderAndAlert", "native-settings--header-and-alert"],
    ["submitDisabled", "native-settings--submit-disabled"],
    ["HTMLPreview", "native-settings--html-preview"],
  ])("maps %s to %s", (exportName, id) => {
    expect(toStoryId("native-settings", exportName)).toBe(id)
  })
})

describe("buildGalleryEntries", () => {
  it("lists stories in registry order, then export-name order, skipping the meta", () => {
    const entries = buildGalleryEntries([first, second])
    expect(entries.map((entry) => entry.id)).toEqual([
      "sample--long-strings",
      "sample--switches",
      "other--default",
    ])
    expect(entries[1]).toEqual({
      id: "sample--switches",
      metaId: "sample",
      title: "gallery.title",
      name: "gallery.nativeSettings.story.switches",
      story: first.Switches,
      component: Sample,
    })
    expect(entries[2]?.component).toBe(Other)
  })

  it("returns nothing for an empty registry", () => {
    expect(buildGalleryEntries([])).toEqual([])
  })
})

describe("findGalleryEntry", () => {
  const entries = buildGalleryEntries([first, second])

  it("finds a story by id", () => {
    expect(findGalleryEntry(entries, "other--default")?.metaId).toBe("other")
  })

  it("returns undefined for an unknown id", () => {
    expect(findGalleryEntry(entries, "does-not-exist")).toBeUndefined()
  })
})
