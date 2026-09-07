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
  let publication: ExportGuidePublicationService

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "export-guide-publication-"))
    store = new ExportGuideCatalogueStore(directory, validator)
    assetValidator = { validate: jest.fn().mockResolvedValue(undefined) }
    publication = new ExportGuidePublicationService(
      validator,
      assetValidator as unknown as ExportGuideAssetValidator,
      store,
      {
        findVisible: jest.fn().mockResolvedValue([]),
      } as unknown as ExportGuideSchoolRepository,
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
