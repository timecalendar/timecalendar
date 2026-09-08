import { EXPORT_GUIDE_PROVIDER_SLUG } from "./constants"
import type {
  ExportGuideCatalogue,
  ExportGuidePage,
  ExportGuideProvider,
  ExportGuideResolution,
  ExportGuideResolutionReason,
} from "./types"

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

const copyPages = (pages: readonly ExportGuidePage[]): ExportGuidePage[] =>
  pages.map((page) => ({
    title: page.title,
    description: page.description,
    ...(page.image === undefined
      ? {}
      : {
          image: {
            url: page.image.url,
            mimeType: page.image.mimeType,
            byteSize: page.image.byteSize,
            width: page.image.width,
            height: page.image.height,
            altText: page.image.altText,
            ...(page.image.caption === undefined
              ? {}
              : { caption: page.image.caption }),
          },
        }),
  }))

export function getSelectableExportGuideProviders(
  catalogue: ExportGuideCatalogue,
): readonly ExportGuideProvider[] {
  return catalogue.providers.filter(({ selectable }) => selectable)
}

export function resolveExportGuideProvider(
  catalogue: ExportGuideCatalogue,
  requestedProviderSlug: string,
): ExportGuideResolution {
  const generic = catalogue.providers.find(({ slug }) => slug === "generic")
  if (generic === undefined) {
    throw new Error("Validated export-guide catalogue has no Generic provider")
  }

  let provider = generic
  let reason: ExportGuideResolutionReason = "missing"
  if (requestedProviderSlug === "generic") {
    reason = "generic"
  } else if (EXPORT_GUIDE_PROVIDER_SLUG.test(requestedProviderSlug)) {
    const exact = catalogue.providers.find(
      ({ slug }) => slug === requestedProviderSlug,
    )
    if (exact !== undefined) {
      provider = exact
      reason = "exact"
    } else {
      reason = catalogue.rejectedProviders[requestedProviderSlug] ?? "missing"
    }
  }

  return deepFreeze({
    provider,
    reason,
    snapshot: {
      locale: catalogue.locale,
      catalogueVersion: catalogue.catalogueVersion,
      providerSlug: provider.slug,
      providerLabel: provider.label,
      pages: copyPages(provider.pages),
      reason,
    },
  })
}
