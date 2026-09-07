import { createInitialExportGuideCatalogue } from "modules/export-guide/data/initial-export-guide-catalogue"
import { ExportGuideCatalogueStore } from "modules/export-guide/stores/export-guide-catalogue.store"
import { ExportGuideCatalogueValidator } from "modules/export-guide/validation/export-guide-catalogue.validator"

describe("ExportGuideCatalogueStore", () => {
  const validator = new ExportGuideCatalogueValidator()
  let repository: ExportGuideCatalogueStore

  beforeEach(() => {
    repository = new ExportGuideCatalogueStore(validator)
  })

  const bundle = (version: string, publishedAt = new Date(0)) => {
    const fr: any = JSON.parse(
      JSON.stringify(createInitialExportGuideCatalogue("fr")),
    )
    const en: any = JSON.parse(
      JSON.stringify(createInitialExportGuideCatalogue("en")),
    )
    fr.catalogueVersion = version
    en.catalogueVersion = version
    return Object.freeze({
      catalogueVersion: version,
      catalogues: validator.validatePair(fr, en),
      publishedAt,
    })
  }

  it("keeps a staged version invisible until one atomic commit", () => {
    repository.stage(bundle("later"))
    expect(repository.find("later")).toBeUndefined()
    const before = repository.capture()
    repository.commitStaged("later")
    const after = repository.capture()
    expect(before.activeVersion).not.toBe("later")
    expect(after.activeVersion).toBe("later")
    expect(repository.find("later")).toBe(after.active)
    expect(() =>
      (after.retained as Map<string, unknown>).set("mutation", {}),
    ).toThrow("snapshot_immutable")
  })

  it("rejects overwrites and rolls back only to retained versions", () => {
    repository.stage(bundle("later"))
    repository.commitStaged("later")
    expect(() => repository.stage(bundle("later"))).toThrow("version_exists")
    const initial = [...repository.capture().retained.keys()][0]
    repository.activate(initial)
    expect(repository.capture().activeVersion).toBe(initial)
    expect(() => repository.activate("missing")).toThrow("version_missing")
  })

  it("prunes strictly after 24 hours plus cache age", () => {
    const publishedAt = new Date("2026-01-01T00:00:00.000Z")
    repository.stage(bundle("old", publishedAt))
    repository.commitStaged("old")
    const initial = [...repository.capture().retained.keys()].find(
      (version) => version !== "old",
    )!
    repository.activate(initial)
    const cacheAge = 60_000
    const boundary = publishedAt.getTime() + 24 * 60 * 60 * 1000 + cacheAge
    expect(repository.prune(new Date(boundary), cacheAge, new Set())).toEqual(
      [],
    )
    expect(
      repository.prune(new Date(boundary + 1), cacheAge, new Set(["old"])),
    ).toEqual([])
    expect(
      repository.prune(new Date(boundary + 1), cacheAge, new Set()),
    ).toEqual(["old"])
  })

  it("never prunes the active version", () => {
    repository.stage(bundle("active", new Date(0)))
    repository.commitStaged("active")
    expect(
      repository.prune(new Date("2030-01-01"), 0, new Set()),
    ).not.toContain("active")
    expect(repository.capture().activeVersion).toBe("active")
  })
})
