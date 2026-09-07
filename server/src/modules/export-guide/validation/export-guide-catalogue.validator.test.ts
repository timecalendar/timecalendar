import { createInitialExportGuideCatalogue } from "modules/export-guide/data/initial-export-guide-catalogue"
import { ExportGuideCatalogueValidator } from "modules/export-guide/validation/export-guide-catalogue.validator"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

describe("ExportGuideCatalogueValidator", () => {
  const validator = new ExportGuideCatalogueValidator()

  it("normalizes, freezes, and ignores additive fields", () => {
    const candidate: any = clone(createInitialExportGuideCatalogue("fr"))
    candidate.futureMetadata = { safe: true }
    candidate.providers[0].futureMetadata = "ignored"
    const result = validator.validate(candidate)
    expect(result).not.toHaveProperty("futureMetadata")
    expect(result.providers[0]).not.toHaveProperty("futureMetadata")
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.providers[0].pages)).toBe(true)
  })

  it.each([
    ["schema", (v: any) => (v.schemaVersion = 2)],
    ["empty version", (v: any) => (v.catalogueVersion = "")],
    ["long version", (v: any) => (v.catalogueVersion = "a".repeat(129))],
    ["non-ASCII version", (v: any) => (v.catalogueVersion = "été")],
    ["locale", (v: any) => (v.locale = "de")],
    ["no providers", (v: any) => (v.providers = [])],
    [
      "too many providers",
      (v: any) =>
        (v.providers = Array.from({ length: 51 }, (_, index) => ({
          ...v.providers[0],
          slug: `p-${index}`,
        }))),
    ],
    ["duplicate slug", (v: any) => (v.providers[1].slug = "ade")],
    ["uppercase slug", (v: any) => (v.providers[0].slug = "ADE")],
    ["long slug", (v: any) => (v.providers[0].slug = `a${"b".repeat(64)}`)],
    ["empty label", (v: any) => (v.providers[0].label = "")],
    ["untrimmed label", (v: any) => (v.providers[0].label = " ADE")],
    ["long label", (v: any) => (v.providers[0].label = "a".repeat(81))],
    ["kind", (v: any) => (v.providers[0].kind = "video")],
    ["selectable", (v: any) => (v.providers[0].selectable = "yes")],
    [
      "compatibility minimum",
      (v: any) => (v.providers[0].compatibility.minClientSchema = 0),
    ],
    [
      "compatibility ordering",
      (v: any) =>
        (v.providers[0].compatibility = {
          minClientSchema: 2,
          maxClientSchema: 1,
        }),
    ],
    ["no pages", (v: any) => (v.providers[0].pages = [])],
    [
      "too many pages",
      (v: any) =>
        (v.providers[0].pages = Array(21).fill(v.providers[0].pages[0])),
    ],
    ["empty title", (v: any) => (v.providers[0].pages[0].title = "")],
    [
      "long title",
      (v: any) => (v.providers[0].pages[0].title = "a".repeat(121)),
    ],
    [
      "empty description",
      (v: any) => (v.providers[0].pages[0].description = ""),
    ],
    [
      "long description",
      (v: any) => (v.providers[0].pages[0].description = "a".repeat(2001)),
    ],
    [
      "missing generic",
      (v: any) =>
        (v.providers = v.providers.filter((p: any) => p.slug !== "generic")),
    ],
    [
      "generic not selectable",
      (v: any) =>
        (v.providers.find((p: any) => p.slug === "generic").selectable = false),
    ],
    [
      "generic incompatible",
      (v: any) =>
        (v.providers.find(
          (p: any) => p.slug === "generic",
        ).compatibility.minClientSchema = 2),
    ],
  ])("rejects %s", (_label, mutate) => {
    const candidate: any = clone(createInitialExportGuideCatalogue("fr"))
    mutate(candidate)
    expect(() => validator.validate(candidate)).toThrow()
  })

  it.each([
    ["provider order", (v: any) => v.providers.reverse()],
    ["kind", (v: any) => (v.providers[0].kind = "other")],
    ["selectability", (v: any) => (v.providers[0].selectable = false)],
    [
      "compatibility",
      (v: any) => (v.providers[0].compatibility.maxClientSchema = 2),
    ],
    ["page count", (v: any) => v.providers[0].pages.pop()],
    [
      "thumbnail role",
      (v: any) => (v.providers[0].thumbnail = v.providers[0].pages[0].image),
    ],
    ["page image role", (v: any) => delete v.providers[0].pages[0].image],
  ])("rejects bilingual %s mismatch", (_label, mutate) => {
    const fr: any = clone(createInitialExportGuideCatalogue("fr"))
    const en: any = clone(createInitialExportGuideCatalogue("en"))
    mutate(en)
    expect(() => validator.validatePair(fr, en)).toThrow()
  })

  it("accepts locale-specific copy and assets with structural parity", () => {
    expect(
      validator.validatePair(
        createInitialExportGuideCatalogue("fr"),
        createInitialExportGuideCatalogue("en"),
        { initial: true },
      ).en.providers[0].label,
    ).toBe("ADE")
  })

  it("keeps initial ordering strict and later providers data-driven", () => {
    const fr: any = clone(createInitialExportGuideCatalogue("fr"))
    const en: any = clone(createInitialExportGuideCatalogue("en"))
    const later = {
      ...fr.providers[0],
      slug: "future-provider",
      label: "Future",
    }
    fr.providers.splice(1, 0, later)
    en.providers.splice(1, 0, { ...later, label: "Future EN" })
    expect(() => validator.validatePair(fr, en, { initial: true })).toThrow()
    expect(validator.validatePair(fr, en).fr.providers[1].slug).toBe(
      "future-provider",
    )
  })

  it("enforces image metadata bounds", () => {
    const cases = [
      { byteSize: 0 },
      { byteSize: 1048577 },
      { width: 0 },
      { width: 4097 },
      { width: 4096, height: 4096 },
      { altText: "" },
      { altText: "a".repeat(501) },
      { caption: "" },
      { caption: "a".repeat(501) },
      { mimeType: "image/gif" },
    ]
    for (const change of cases) {
      const candidate: any = clone(createInitialExportGuideCatalogue("fr"))
      Object.assign(candidate.providers[0].pages[0].image, change)
      expect(() => validator.validate(candidate)).toThrow()
    }
  })
})
