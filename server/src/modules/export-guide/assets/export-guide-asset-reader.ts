import { readFile } from "fs/promises"
import { join, normalize, sep } from "path"
import { Injectable } from "@nestjs/common"
import axios from "axios"
import { ExportGuideValidationError } from "modules/export-guide/validation/export-guide-validation.error"

export type ExportGuideAsset = Readonly<{
  bytes: Buffer
  mimeType: string
  redirected: boolean
}>

export abstract class ExportGuideAssetReader {
  abstract read(url: URL, maximumBytes: number): Promise<ExportGuideAsset>
}

@Injectable()
export class HttpExportGuideAssetReader implements ExportGuideAssetReader {
  async read(url: URL, maximumBytes: number): Promise<ExportGuideAsset> {
    try {
      const response = await axios.get<ArrayBuffer>(url.toString(), {
        responseType: "arraybuffer",
        maxRedirects: 0,
        timeout: 5000,
        maxContentLength: maximumBytes,
        maxBodyLength: maximumBytes,
        validateStatus: (status) => status === 200,
      })
      const bytes = Buffer.from(response.data)
      if (bytes.length > maximumBytes)
        throw new ExportGuideValidationError("asset_oversize")
      return {
        bytes,
        mimeType: String(response.headers["content-type"] ?? "")
          .split(";", 1)[0]
          .trim()
          .toLowerCase(),
        redirected: false,
      }
    } catch (error) {
      if (error instanceof ExportGuideValidationError) throw error
      throw new ExportGuideValidationError("asset_unavailable")
    }
  }
}

export class FileExportGuideAssetReader implements ExportGuideAssetReader {
  constructor(
    private readonly root: string,
    private readonly mimeTypes: Readonly<Record<string, string>>,
  ) {}

  async read(url: URL, maximumBytes: number): Promise<ExportGuideAsset> {
    const relativePath = normalize(decodeURIComponent(url.pathname)).replace(
      new RegExp(`^\\${sep}+`),
      "",
    )
    if (relativePath.split(sep).includes(".."))
      throw new ExportGuideValidationError("asset_path")
    const bytes = await readFile(join(this.root, relativePath))
    if (bytes.length > maximumBytes)
      throw new ExportGuideValidationError("asset_oversize")
    return {
      bytes,
      mimeType: this.mimeTypes[url.pathname] ?? "application/octet-stream",
      redirected: false,
    }
  }
}
