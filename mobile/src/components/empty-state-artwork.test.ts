import { developerActivityArtwork, noDataArtwork } from "./empty-state-artwork"

describe("empty-state artwork", () => {
  it("resolves all bundled light and dark PNG sources through Metro/Jest", () => {
    expect(developerActivityArtwork.light).toBeDefined()
    expect(developerActivityArtwork.dark).toBeDefined()
    expect(noDataArtwork.light).toBeDefined()
    expect(noDataArtwork.dark).toBeDefined()
    expect(Object.keys(developerActivityArtwork)).toEqual(["light", "dark"])
    expect(Object.keys(noDataArtwork)).toEqual(["light", "dark"])
  })
})
