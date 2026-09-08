import { readFile } from "fs/promises"
import { join } from "path"
import { ExportGuideAsset } from "modules/export-guide/assets/export-guide-asset-reader"
import {
  E2E_EXPORT_GUIDE_VERSION,
  INITIAL_EXPORT_GUIDE_VERSION,
} from "modules/export-guide/data/initial-export-guide-catalogue"
import { ExportGuideValidationError } from "modules/export-guide/validation/export-guide-validation.error"

const initialPath = (path: string) =>
  `/export-guides/${INITIAL_EXPORT_GUIDE_VERSION}/${path}`

const e2ePath = (path: string) =>
  `/export-guides/${E2E_EXPORT_GUIDE_VERSION}/${path}`

const INITIAL_ASSET_FILES: Readonly<Record<string, string>> = Object.freeze({
  [initialPath("fr/ade/groupes.png")]: "ade-schema.png",
  [initialPath("en/ade/groups.png")]: "ade-schema.png",
  [initialPath("fr/ade/export.png")]: "ade-export-icon.png",
  [initialPath("en/ade/export.png")]: "ade-export-icon.png",
  [initialPath("fr/ade/periode.png")]: "ade-export-popup.png",
  [initialPath("en/ade/range.png")]: "ade-export-popup.png",
  [initialPath("fr/ade/url.png")]: "ade-export-url.png",
  [initialPath("en/ade/url.png")]: "ade-export-url.png",
  [initialPath("fr/hplanning/export.png")]: "hplanning-export-icon.png",
  [initialPath("en/hplanning/export.png")]: "hplanning-export-icon.png",
  [initialPath("fr/hplanning/url.png")]: "hplanning-export-popup.png",
  [initialPath("en/hplanning/url.png")]: "hplanning-export-popup.png",
  [initialPath("fr/celcat/groupes.png")]: "celcat-select-groups.png",
  [initialPath("en/celcat/groups.png")]: "celcat-select-groups.png",
  [initialPath("fr/celcat/semaines.png")]: "celcat-select-weeks.png",
  [initialPath("en/celcat/weeks.png")]: "celcat-select-weeks.png",
  [initialPath("fr/celcat/ics.png")]: "celcat-export-ical.png",
  [initialPath("en/celcat/ics.png")]: "celcat-export-ical.png",
  [initialPath("fr/generic/calendrier.png")]: "generic-show-calendar.png",
  [initialPath("en/generic/calendar.png")]: "generic-show-calendar.png",
})

const ASSET_FILES: Readonly<Record<string, string>> = Object.freeze({
  ...INITIAL_ASSET_FILES,
  ...Object.fromEntries(
    Object.entries(INITIAL_ASSET_FILES).map(([path, file]) => [
      path.replace(INITIAL_EXPORT_GUIDE_VERSION, E2E_EXPORT_GUIDE_VERSION),
      file,
    ]),
  ),
  [e2ePath("fr/generic/controlled-broken.png")]: "generic-show-calendar.png",
  [e2ePath("en/generic/controlled-broken.png")]: "generic-show-calendar.png",
})

export class PackagedInitialExportGuideAssetReader {
  constructor(private readonly directory: string) {}

  async read(url: URL, maximumBytes: number): Promise<ExportGuideAsset> {
    const file = ASSET_FILES[url.pathname]
    if (!file) throw new ExportGuideValidationError("asset_unavailable")

    let bytes: Buffer
    try {
      bytes = await readFile(join(this.directory, file))
    } catch {
      throw new ExportGuideValidationError("asset_unavailable")
    }
    if (bytes.length > maximumBytes)
      throw new ExportGuideValidationError("asset_oversize")

    return { bytes, mimeType: "image/png", redirected: false }
  }
}
