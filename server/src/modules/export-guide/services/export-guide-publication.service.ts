import { Injectable } from "@nestjs/common"
import { ExportGuideAssetValidator } from "modules/export-guide/assets/export-guide-asset.validator"
import { createInitialExportGuideCatalogue } from "modules/export-guide/data/initial-export-guide-catalogue"
import {
  EXPORT_GUIDE_PROVIDER_SLUG_PATTERN,
  ExportGuideBundle,
  ExportGuideImageRole,
  ExportGuideImageV1,
} from "modules/export-guide/models/export-guide.model"
import { ExportGuideCatalogueStore } from "modules/export-guide/stores/export-guide-catalogue.store"
import { ExportGuideSchoolRepository } from "modules/export-guide/repositories/export-guide-school.repository"
import { ExportGuideCatalogueValidator } from "modules/export-guide/validation/export-guide-catalogue.validator"
import { ExportGuideValidationError } from "modules/export-guide/validation/export-guide-validation.error"

type AssetDeclaration = {
  image: ExportGuideImageV1
  role: ExportGuideImageRole
}

@Injectable()
export class ExportGuidePublicationService {
  constructor(
    private readonly validator: ExportGuideCatalogueValidator,
    private readonly assetValidator: ExportGuideAssetValidator,
    private readonly catalogues: ExportGuideCatalogueStore,
    private readonly schools: ExportGuideSchoolRepository,
  ) {}

  async publish(
    fr: unknown,
    en: unknown,
    options: { initial?: boolean; now?: Date } = {},
  ): Promise<ExportGuideBundle> {
    const catalogues = this.validator.validatePair(fr, en, options)
    const catalogueVersion = catalogues.fr.catalogueVersion
    if (this.catalogues.capture().retained.has(catalogueVersion))
      throw new ExportGuideValidationError("version_exists")

    const schools = await this.schools.findVisible()
    if (
      schools.some(
        ({ assistant }) => !EXPORT_GUIDE_PROVIDER_SLUG_PATTERN.test(assistant),
      )
    )
      throw new ExportGuideValidationError("school_provider_slug")

    const assets = new Map<string, AssetDeclaration>()
    for (const catalogue of Object.values(catalogues)) {
      for (const provider of catalogue.providers) {
        if (provider.thumbnail)
          this.addAsset(assets, provider.thumbnail, "thumbnail")
        for (const page of provider.pages)
          if (page.image) this.addAsset(assets, page.image, "page")
      }
    }
    for (const { image, role } of assets.values())
      await this.assetValidator.validate(image, role)

    const bundle: ExportGuideBundle = Object.freeze({
      catalogueVersion,
      catalogues,
      publishedAt: options.now ?? new Date(),
    })
    this.catalogues.stage(bundle)
    try {
      this.catalogues.commitStaged(catalogueVersion)
    } catch (error) {
      this.catalogues.discardStaged(catalogueVersion)
      throw error
    }
    return bundle
  }

  async publishInitial(): Promise<ExportGuideBundle> {
    return this.publish(
      createInitialExportGuideCatalogue("fr"),
      createInitialExportGuideCatalogue("en"),
      { initial: true, now: new Date(0) },
    )
  }

  private addAsset(
    assets: Map<string, AssetDeclaration>,
    image: ExportGuideImageV1,
    role: ExportGuideImageRole,
  ): void {
    const existing = assets.get(image.url)
    if (existing) {
      if (
        existing.image.mimeType !== image.mimeType ||
        existing.image.byteSize !== image.byteSize ||
        existing.image.width !== image.width ||
        existing.image.height !== image.height
      )
        throw new ExportGuideValidationError("asset_metadata_conflict")
      if (role === "thumbnail") existing.role = "thumbnail"
      return
    }
    assets.set(image.url, { image, role })
  }

  rollback(version: string): void {
    this.catalogues.activate(version)
  }

  prune(
    now: Date,
    cacheAgeMs: number,
    referencedVersions: ReadonlySet<string>,
  ) {
    return this.catalogues.prune(now, cacheAgeMs, referencedVersions)
  }
}
