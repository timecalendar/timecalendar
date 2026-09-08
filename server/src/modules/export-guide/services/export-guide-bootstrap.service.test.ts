import { ExportGuideAssetValidator } from "modules/export-guide/assets/export-guide-asset.validator"
import { ExportGuideBootstrapService } from "modules/export-guide/services/export-guide-bootstrap.service"
import { ExportGuidePublicationService } from "modules/export-guide/services/export-guide-publication.service"
import { ExportGuideCatalogueStore } from "modules/export-guide/stores/export-guide-catalogue.store"

describe("ExportGuideBootstrapService", () => {
  const initialAssetValidator = {} as ExportGuideAssetValidator
  const publication = {
    bootstrapInitial: jest.fn().mockResolvedValue(undefined),
  } as unknown as ExportGuidePublicationService

  beforeEach(() => {
    jest.clearAllMocks()
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

    expect(publication.bootstrapInitial).toHaveBeenCalledWith(
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

    expect(publication.bootstrapInitial).not.toHaveBeenCalled()
  })
})
