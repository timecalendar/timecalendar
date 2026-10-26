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
  Switches: { name: "gallery.nativeList.story.switches", args: {} },
  LongStrings: {
    name: "gallery.nativeList.story.longStrings",
    render: () => null,
    platforms: ["android"],
  },
}

const second: GalleryModule = {
  default: {
    id: "other",
    title: "gallery.nativeList.title",
    component: Other,
    stories: ["Default"],
  },
  Default: { name: "gallery.textEntryDialog.story.default", args: {} },
}

describe("toStoryId", () => {
  it.each([
    ["Rows", "native-list--rows"],
    ["LongStrings", "native-list--long-strings"],
    ["HeaderAndAlert", "native-list--header-and-alert"],
    ["submitDisabled", "native-list--submit-disabled"],
    ["HTMLPreview", "native-list--html-preview"],
  ])("maps %s to %s", (exportName, id) => {
    expect(toStoryId("native-list", exportName)).toBe(id)
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
      name: "gallery.nativeList.story.switches",
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
