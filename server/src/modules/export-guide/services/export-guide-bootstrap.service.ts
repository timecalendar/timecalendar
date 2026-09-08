import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common"
import { ExportGuideAssetValidator } from "modules/export-guide/assets/export-guide-asset.validator"
import { ExportGuidePublicationService } from "modules/export-guide/services/export-guide-publication.service"
import { ExportGuideCatalogueStore } from "modules/export-guide/stores/export-guide-catalogue.store"

export const EXPORT_GUIDE_INITIAL_ASSET_VALIDATOR =
  "EXPORT_GUIDE_INITIAL_ASSET_VALIDATOR"

@Injectable()
export class ExportGuideBootstrapService implements OnApplicationBootstrap {
  constructor(
    private readonly catalogues: ExportGuideCatalogueStore,
    private readonly publication: ExportGuidePublicationService,
    @Inject(EXPORT_GUIDE_INITIAL_ASSET_VALIDATOR)
    private readonly initialAssetValidator: ExportGuideAssetValidator,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.catalogues.capture().activeVersion) return
    await this.publication.publishInitial(this.initialAssetValidator)
  }
}
