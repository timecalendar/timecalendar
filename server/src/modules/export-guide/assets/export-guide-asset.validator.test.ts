import { readFile } from "fs/promises"
import { join } from "path"
import {
  ExportGuideAssetReader,
  FileExportGuideAssetReader,
} from "modules/export-guide/assets/export-guide-asset-reader"
import { ExportGuideAssetValidator } from "modules/export-guide/assets/export-guide-asset.validator"
import { ExportGuideImageV1 } from "modules/export-guide/models/export-guide.model"
import { ExportGuideUrlPolicy } from "modules/export-guide/validation/export-guide-url-policy"

const root = join(__dirname, "__fixtures__")
const origin = "https://assets.example.com"
const mimeTypes = {
  "/static.png": "image/png",
  "/static.jpg": "image/jpeg",
  "/static.webp": "image/webp",
  "/animated.webp": "image/webp",
  "/invalid.bin": "image/png",
}

describe("ExportGuideUrlPolicy", () => {
  const policy = new ExportGuideUrlPolicy(origin)

  it("accepts only the exact HTTPS asset origin", () => {
    expect(policy.validate(`${origin}/static.png`).pathname).toBe("/static.png")
  })

  it.each([
    "http://assets.example.com/static.png",
    "https://other.example.com/static.png",
    "https://user:pass@assets.example.com/static.png",
    "https://assets.example.com:444/static.png",
    "https://assets.example.com/static.png?q=secret",
    "https://assets.example.com/static.png#fragment",
    "not-a-url",
    `${origin}/${"a".repeat(2050)}`,
  ])("rejects an unsafe URL policy case", (value) => {
    expect(() => policy.validate(value)).toThrow("asset_url")
  })
})

describe("ExportGuideAssetValidator", () => {
  const reader = new FileExportGuideAssetReader(root, mimeTypes)
  const validator = new ExportGuideAssetValidator(
    reader,
    new ExportGuideUrlPolicy(origin),
  )

  const declaration = async (
    file: string,
    mimeType: ExportGuideImageV1["mimeType"],
    width: number,
    height: number,
  ): Promise<ExportGuideImageV1> => ({
    url: `${origin}/${file}`,
    mimeType,
    byteSize: (await readFile(join(root, file))).length,
    width,
    height,
    altText: "Meaningful screenshot description",
    caption: "Visible explanation",
  })

  it.each([
    ["static.png", "image/png"],
    ["static.jpg", "image/jpeg"],
    ["static.webp", "image/webp"],
  ] as const)("decodes and verifies %s", async (file, mime) => {
    await expect(
      validator.validate(await declaration(file, mime, 2, 2), "page"),
    ).resolves.toBeUndefined()
  })

  it.each([
    ["declared MIME", { mimeType: "image/jpeg" }],
    ["encoded bytes", { byteSize: 1 }],
    ["width", { width: 3 }],
    ["height", { height: 3 }],
  ])("rejects a %s mismatch", async (_label, change) => {
    const image = await declaration("static.png", "image/png", 2, 2)
    await expect(
      validator.validate({ ...image, ...change } as ExportGuideImageV1, "page"),
    ).rejects.toThrow()
  })

  it("rejects animated WebP from actual decoded frame metadata", async () => {
    const image = await declaration("animated.webp", "image/webp", 16, 32)
    await expect(validator.validate(image, "page")).rejects.toThrow(
      "asset_animated",
    )
  })

  it("rejects unsupported or invalid bytes despite an allowed header", async () => {
    const image = await declaration("invalid.bin", "image/png", 2, 2)
    await expect(validator.validate(image, "page")).rejects.toThrow(
      "asset_decode",
    )
  })

  it.each([
    [
      "redirect",
      { bytes: Buffer.alloc(1), mimeType: "image/png", redirected: true },
    ],
    ["oversize", new Error("asset_oversize")],
    ["timeout", new Error("asset_unavailable")],
  ])("fails closed on reader %s", async (_label, result) => {
    const failingReader: ExportGuideAssetReader = {
      read: async () => {
        if (result instanceof Error) throw result
        return result
      },
    }
    const guarded = new ExportGuideAssetValidator(
      failingReader,
      new ExportGuideUrlPolicy(origin),
    )
    const image = await declaration("static.png", "image/png", 2, 2)
    await expect(guarded.validate(image, "page")).rejects.toThrow()
  })

  it("enforces the smaller thumbnail transport bound", async () => {
    const oversized: ExportGuideAssetReader = {
      read: async (_url, maximumBytes) => {
        expect(maximumBytes).toBe(262144)
        throw new Error("asset_oversize")
      },
    }
    const guarded = new ExportGuideAssetValidator(
      oversized,
      new ExportGuideUrlPolicy(origin),
    )
    const image = await declaration("static.png", "image/png", 2, 2)
    await expect(guarded.validate(image, "thumbnail")).rejects.toThrow()
  })
})
