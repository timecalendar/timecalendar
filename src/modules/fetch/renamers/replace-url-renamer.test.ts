import { ReplaceUrlRenamer } from "./replace-url-renamer"

describe("ReplaceUrlRenamer", () => {
  it("should replace the url", () => {
    const renamer = new ReplaceUrlRenamer(
      "https://google.com",
      "https://bing.com",
    )
    const url = "https://google.com/search"

    const newUrl = renamer.rename(url)

    expect(newUrl).toBe("https://bing.com/search")
  })
})
