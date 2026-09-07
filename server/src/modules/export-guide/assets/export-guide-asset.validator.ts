import { Injectable } from "@nestjs/common"
import sharp from "sharp"
import {
  EXPORT_GUIDE_IMAGE_MAX_BYTES,
  EXPORT_GUIDE_IMAGE_MAX_DIMENSION,
  EXPORT_GUIDE_IMAGE_MAX_PIXELS,
  ExportGuideImageRole,
  ExportGuideImageV1,
} from "modules/export-guide/models/export-guide.model"
import { ExportGuideAssetReader } from "modules/export-guide/assets/export-guide-asset-reader"
import { ExportGuideUrlPolicy } from "modules/export-guide/validation/export-guide-url-policy"
import { ExportGuideValidationError } from "modules/export-guide/validation/export-guide-validation.error"

const formats = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
} as const

@Injectable()
export class ExportGuideAssetValidator {
  constructor(
    private readonly reader: ExportGuideAssetReader,
    private readonly urlPolicy: ExportGuideUrlPolicy,
  ) {}

  async validate(
    image: ExportGuideImageV1,
    role: ExportGuideImageRole,
  ): Promise<void> {
    const url = this.urlPolicy.validate(image.url)
    const roleLimit = EXPORT_GUIDE_IMAGE_MAX_BYTES[role]
    const asset = await this.reader.read(url, roleLimit)
    if (asset.redirected) throw new ExportGuideValidationError("asset_redirect")
    if (asset.mimeType !== image.mimeType)
      throw new ExportGuideValidationError("asset_mime")
    if (asset.bytes.length !== image.byteSize)
      throw new ExportGuideValidationError("asset_bytes")
    let metadata: sharp.Metadata
    try {
      metadata = await sharp(asset.bytes, {
        animated: true,
        limitInputPixels: EXPORT_GUIDE_IMAGE_MAX_PIXELS,
      }).metadata()
    } catch {
      throw new ExportGuideValidationError("asset_decode")
    }
    const decodedMime = formats[metadata.format as keyof typeof formats]
    if (!decodedMime || decodedMime !== image.mimeType)
      throw new ExportGuideValidationError("asset_format")
    if ((metadata.pages ?? 1) !== 1)
      throw new ExportGuideValidationError("asset_animated")
    if (metadata.width !== image.width || metadata.height !== image.height)
      throw new ExportGuideValidationError("asset_dimensions")
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > EXPORT_GUIDE_IMAGE_MAX_DIMENSION ||
      metadata.height > EXPORT_GUIDE_IMAGE_MAX_DIMENSION ||
      metadata.width * metadata.height > EXPORT_GUIDE_IMAGE_MAX_PIXELS
    )
      throw new ExportGuideValidationError("asset_dimensions")
  }
}
