import { createHash } from "crypto"
import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common"
import { ExportGuideLocale } from "modules/export-guide/models/export-guide.model"
import { ExportGuideCatalogueStore } from "modules/export-guide/stores/export-guide-catalogue.store"
import { FeatureFlagService } from "modules/feature-flag/services/feature-flag.service"

export const EXPORT_GUIDE_FEATURE_FLAG = "export-guides-v1"
export const EXPORT_GUIDE_UNAVAILABLE_MESSAGE =
  "Export guide catalogue unavailable"

export type ExportGuideRepresentation = Readonly<{
  body: string
  etag: string
  locale: ExportGuideLocale
}>

@Injectable()
export class ExportGuideService {
  private readonly representations = new Map<
    string,
    ExportGuideRepresentation
  >()

  constructor(
    private readonly featureFlags: FeatureFlagService,
    private readonly catalogues: ExportGuideCatalogueStore,
  ) {}

  async get(
    locale: ExportGuideLocale,
    clientSchema: 1,
    catalogueVersion?: string,
  ): Promise<ExportGuideRepresentation> {
    let enabled = false
    try {
      enabled =
        (await this.featureFlags.evaluateFlag(
          EXPORT_GUIDE_FEATURE_FLAG,
          false,
        )) === true
    } catch {
      enabled = false
    }
    if (!enabled)
      throw new ServiceUnavailableException(EXPORT_GUIDE_UNAVAILABLE_MESSAGE)

    try {
      const bundle = this.catalogues.find(catalogueVersion)
      if (!bundle) {
        if (catalogueVersion)
          throw new NotFoundException("Export guide catalogue not found")
        throw new ServiceUnavailableException(EXPORT_GUIDE_UNAVAILABLE_MESSAGE)
      }
      const catalogue = bundle.catalogues[locale]
      if (!catalogue || catalogue.schemaVersion !== clientSchema)
        throw new ServiceUnavailableException(EXPORT_GUIDE_UNAVAILABLE_MESSAGE)
      const key = `${locale}\u0000${clientSchema}\u0000${bundle.catalogueVersion}`
      const cached = this.representations.get(key)
      if (cached) return cached
      const body = JSON.stringify(catalogue)
      if (Buffer.byteLength(body, "utf8") > 512 * 1024)
        throw new ServiceUnavailableException(EXPORT_GUIDE_UNAVAILABLE_MESSAGE)
      const representation = Object.freeze({
        body,
        etag: `"${createHash("sha256").update(body).digest("hex")}"`,
        locale,
      })
      this.representations.set(key, representation)
      return representation
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException
      )
        throw error
      throw new ServiceUnavailableException(EXPORT_GUIDE_UNAVAILABLE_MESSAGE)
    }
  }
}
