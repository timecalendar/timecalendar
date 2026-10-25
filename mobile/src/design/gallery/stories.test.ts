import {
  buildGalleryEntries,
  findGalleryEntry,
  isGalleryEntryAvailable,
  toStoryId,
} from "./stories"
import type { GalleryModule } from "./types"

const Sample = () => null
const Other = () => null

const first: GalleryModule = {
  default: {
    id: "sample",
    title: "gallery.title",
    component: Sample,
    stories: ["Switches", "LongStrings"],
  },
  Switches: { name: "gallery.nativeSettings.story.switches", args: {} },
  LongStrings: {
    name: "gallery.nativeSettings.story.longStrings",
    render: () => null,
    platforms: ["android"],
  },
}

const second: GalleryModule = {
  default: {
    id: "other",
    title: "gallery.nativeSettings.title",
    component: Other,
    stories: ["Default"],
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
  it("lists stories in registry order, then the meta's story order", () => {
    const entries = buildGalleryEntries([first, second])
    expect(entries.map((entry) => entry.id)).toEqual([
      "sample--switches",
      "sample--long-strings",
      "other--default",
    ])
    expect(entries[0]).toEqual({
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

describe("isGalleryEntryAvailable", () => {
  const [switches, longStrings] = buildGalleryEntries([first])

  it("offers a story without platforms everywhere", () => {
    expect(isGalleryEntryAvailable(switches!, "ios")).toBe(true)
    expect(isGalleryEntryAvailable(switches!, "android")).toBe(true)
  })

  it("offers a platform-scoped story only on its platforms", () => {
    expect(isGalleryEntryAvailable(longStrings!, "android")).toBe(true)
    expect(isGalleryEntryAvailable(longStrings!, "ios")).toBe(false)
  })
})
