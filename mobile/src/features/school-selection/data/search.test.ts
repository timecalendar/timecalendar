import { normalize, schoolMatches } from "./search"
import type { SchoolListItem } from "./types"

// The pure accent-insensitive name-or-code matcher (90% logic gate): diacritic
// insensitivity, space/hyphen insensitivity, name-vs-code matching, the
// empty-needle "match all", and a genuine no-match. Mirrors Flutter stringIncludes.

const eiffel: SchoolListItem = {
  id: "univeiffel",
  name: "Université Gustave Eiffel",
  code: "UPEM-77",
  imageUrl: "",
}

describe("normalize", () => {
  it("lowercases, strips diacritics, spaces and hyphens", () => {
    expect(normalize("Université Gustave-Eiffel")).toBe(
      "universitegustaveeiffel",
    )
  })
})

describe("schoolMatches", () => {
  it("matches diacritic-insensitively on name", () => {
    expect(schoolMatches("eiffel", eiffel)).toBe(true)
    expect(schoolMatches("Université", eiffel)).toBe(true)
    expect(schoolMatches("universite", eiffel)).toBe(true)
  })

  it("ignores spaces and hyphens in the needle and the name", () => {
    expect(schoolMatches("gustave eiffel", eiffel)).toBe(true)
    expect(schoolMatches("upem-77", eiffel)).toBe(true)
  })

  it("matches on the code when the name does not match", () => {
    expect(schoolMatches("upem", eiffel)).toBe(true)
  })

  it("matches all schools for an empty / whitespace needle", () => {
    expect(schoolMatches("", eiffel)).toBe(true)
    expect(schoolMatches("   ", eiffel)).toBe(true)
  })

  it("returns false for a genuine no-match", () => {
    expect(schoolMatches("sorbonne", eiffel)).toBe(false)
  })
})
