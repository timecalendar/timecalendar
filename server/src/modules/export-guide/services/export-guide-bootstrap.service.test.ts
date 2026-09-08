import { ExportGuideAssetValidator } from "modules/export-guide/assets/export-guide-asset.validator"
import { ExportGuideBootstrapService } from "modules/export-guide/services/export-guide-bootstrap.service"
import { ExportGuidePublicationService } from "modules/export-guide/services/export-guide-publication.service"
import { ExportGuideCatalogueStore } from "modules/export-guide/stores/export-guide-catalogue.store"
import { QueryFailedError } from "typeorm"

describe("ExportGuideBootstrapService", () => {
  const initialAssetValidator = {} as ExportGuideAssetValidator
  let publication: ExportGuidePublicationService

  beforeEach(() => {
    publication = {
      publishInitial: jest.fn().mockResolvedValue(undefined),
    } as unknown as ExportGuidePublicationService
  })

  it("publishes the packaged catalogue when storage is fresh", async () => {
    const catalogues = {
      capture: jest.fn().mockReturnValue({ retained: new Map() }),
    } as unknown as ExportGuideCatalogueStore
    const bootstrap = new ExportGuideBootstrapService(
      catalogues,
      publication,
      initialAssetValidator,
    )

    await bootstrap.onApplicationBootstrap()

    expect(publication.publishInitial).toHaveBeenCalledWith(
      initialAssetValidator,
    )
  })

  it("does not overwrite an active retained catalogue", async () => {
    const catalogues = {
      capture: jest.fn().mockReturnValue({
        activeVersion: "retained-version",
        retained: new Map(),
      }),
    } as unknown as ExportGuideCatalogueStore
    const bootstrap = new ExportGuideBootstrapService(
      catalogues,
      publication,
      initialAssetValidator,
    )

    await bootstrap.onApplicationBootstrap()

    expect(publication.publishInitial).not.toHaveBeenCalled()
  })

  it("leaves activation deferred while the school schema is unavailable", async () => {
    const missingTable = new QueryFailedError(
      'SELECT "assistant" FROM "school"',
      [],
      Object.assign(new Error("relation does not exist"), { code: "42P01" }),
    )
    const catalogues = {
      capture: jest.fn().mockReturnValue({ retained: new Map() }),
    } as unknown as ExportGuideCatalogueStore
    publication.publishInitial = jest.fn().mockRejectedValueOnce(missingTable)
    const bootstrap = new ExportGuideBootstrapService(
      catalogues,
      publication,
      initialAssetValidator,
    )

    await expect(bootstrap.onApplicationBootstrap()).resolves.toBeUndefined()
    expect(publication.publishInitial).toHaveBeenCalledWith(
      initialAssetValidator,
    )
    expect(catalogues.capture().activeVersion).toBeUndefined()
  })

  it("does not hide other publication failures", async () => {
    const catalogues = {
      capture: jest.fn().mockReturnValue({ retained: new Map() }),
    } as unknown as ExportGuideCatalogueStore
    publication.publishInitial = jest
      .fn()
      .mockRejectedValueOnce(new Error("school_provider_slug"))
    const bootstrap = new ExportGuideBootstrapService(
      catalogues,
      publication,
      initialAssetValidator,
    )

    await expect(bootstrap.onApplicationBootstrap()).rejects.toThrow(
      "school_provider_slug",
    )
  })
})
