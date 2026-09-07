import { Inject, Injectable } from "@nestjs/common"
import { S3_PUBLIC_BUCKET_CLIENT_URL } from "config/constants"
import { ExportGuideValidationError } from "modules/export-guide/validation/export-guide-validation.error"

@Injectable()
export class ExportGuideUrlPolicy {
  private readonly origin: string

  constructor(
    @Inject("EXPORT_GUIDE_ASSET_ORIGIN")
    origin: string = S3_PUBLIC_BUCKET_CLIENT_URL,
  ) {
    try {
      this.origin = new URL(origin).origin
    } catch {
      this.origin = ""
    }
  }

  validate(value: string): URL {
    if (value.length > 2048) throw new ExportGuideValidationError("asset_url")
    let url: URL
    try {
      url = new URL(value)
    } catch {
      throw new ExportGuideValidationError("asset_url")
    }
    if (
      url.protocol !== "https:" ||
      url.origin !== this.origin ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.port
    )
      throw new ExportGuideValidationError("asset_url")
    return url
  }
}
