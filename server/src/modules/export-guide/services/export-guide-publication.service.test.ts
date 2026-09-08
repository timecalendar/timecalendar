import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { ExportGuideAssetValidator } from "modules/export-guide/assets/export-guide-asset.validator"
import { createInitialExportGuideCatalogue } from "modules/export-guide/data/initial-export-guide-catalogue"
import { ExportGuideSchoolRepository } from "modules/export-guide/repositories/export-guide-school.repository"
import { ExportGuidePublicationService } from "modules/export-guide/services/export-guide-publication.service"
import { ExportGuideCatalogueStore } from "modules/export-guide/stores/export-guide-catalogue.store"
import { ExportGuideCatalogueValidator } from "modules/export-guide/validation/export-guide-catalogue.validator"

describe("ExportGuidePublicationService", () => {
  const validator = new ExportGuideCatalogueValidator()
  let directory: string
  let store: ExportGuideCatalogueStore
  let assetValidator: jest.Mocked<Pick<ExportGuideAssetValidator, "validate">>
  let schools: jest.Mocked<Pick<ExportGuideSchoolRepository, "findVisible">>
  let publication: ExportGuidePublicationService

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "export-guide-publication-"))
    store = new ExportGuideCatalogueStore(directory, validator)
    assetValidator = { validate: jest.fn().mockResolvedValue(undefined) }
    schools = { findVisible: jest.fn().mockResolvedValue([]) }
    publication = new ExportGuidePublicationService(
      validator,
      assetValidator as unknown as ExportGuideAssetValidator,
      store,
      schools as unknown as ExportGuideSchoolRepository,
    )
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it("leaves no active snapshot when an initial asset is invalid", async () => {
    assetValidator.validate.mockRejectedValueOnce(new Error("invalid asset"))

    await expect(publication.publishInitial()).rejects.toThrow("invalid asset")

    expect(store.capture().activeVersion).toBeUndefined()
    expect(store.capture().retained.size).toBe(0)
  })

  it("rejects an invalid visible school before bootstrap activation", async () => {
    schools.findVisible.mockResolvedValueOnce([
      { assistant: "INVALID!" },
    ] as never)

    await expect(
      publication.publishInitial(
        assetValidator as unknown as ExportGuideAssetValidator,
      ),
    ).rejects.toThrow("school_provider_slug")

    expect(schools.findVisible).toHaveBeenCalledTimes(1)
    expect(assetValidator.validate).not.toHaveBeenCalled()
    expect(store.capture().activeVersion).toBeUndefined()
    expect(store.capture().retained.size).toBe(0)
  })

  it("retains a newly superseded initial catalogue through the boundary", async () => {
    const publishedAt = new Date("2026-09-08T00:00:00.000Z")
    const cacheAge = 60_000
    await publication.publishInitial(
      assetValidator as unknown as ExportGuideAssetValidator,
      publishedAt,
    )
    const fr: any = JSON.parse(
      JSON.stringify(createInitialExportGuideCatalogue("fr")),
    )
    const en: any = JSON.parse(
      JSON.stringify(createInitialExportGuideCatalogue("en")),
    )
    fr.catalogueVersion = "2026-09-08.1"
    en.catalogueVersion = "2026-09-08.1"
    await publication.publish(fr, en, {
      now: new Date(publishedAt.getTime() + 1),
    })

    const boundary = publishedAt.getTime() + 24 * 60 * 60 * 1000 + cacheAge
    expect(publication.prune(new Date(boundary), cacheAge, new Set())).toEqual(
      [],
    )
    expect(store.find("2026-09-07.1")).toBeDefined()
    expect(
      publication.prune(new Date(boundary + 1), cacheAge, new Set()),
    ).toEqual(["2026-09-07.1"])
  })

  it("rejects conflicting storage metadata declared for one URL", async () => {
    const fr: any = JSON.parse(
      JSON.stringify(createInitialExportGuideCatalogue("fr")),
    )
    const en: any = JSON.parse(
      JSON.stringify(createInitialExportGuideCatalogue("en")),
    )
    en.providers[0].pages[0].image.url = fr.providers[0].pages[0].image.url
    en.providers[0].pages[0].image.byteSize =
      fr.providers[0].pages[0].image.byteSize + 1

    await expect(
      publication.publish(fr, en, { initial: true }),
    ).rejects.toThrow("asset_metadata_conflict")
    expect(assetValidator.validate).not.toHaveBeenCalled()
    expect(store.capture().activeVersion).toBeUndefined()
  })
})
