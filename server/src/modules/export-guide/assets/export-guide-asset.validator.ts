import { Injectable } from "@nestjs/common"
import sharp from "sharp"
import {
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
    const roleLimit = role === "thumbnail" ? 262144 : 1048576
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
        limitInputPixels: 8388608,
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
      metadata.width > 4096 ||
      metadata.height > 4096 ||
      metadata.width * metadata.height > 8388608
    )
      throw new ExportGuideValidationError("asset_dimensions")
  }
}
