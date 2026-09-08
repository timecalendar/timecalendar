import { resolveInitialExportGuideAssetOrigin } from "modules/export-guide/data/initial-export-guide-catalogue"

describe("resolveInitialExportGuideAssetOrigin", () => {
  it.each(["not-a-url", "://missing-scheme"])(
    "rejects malformed origin %s",
    (origin) => {
      expect(() => resolveInitialExportGuideAssetOrigin(origin)).toThrow(
        "asset_origin",
      )
    },
  )

  it.each(["http://assets.example.com", "ftp://assets.example.com"])(
    "rejects non-HTTPS origin %s",
    (origin) => {
      expect(() => resolveInitialExportGuideAssetOrigin(origin)).toThrow(
        "asset_origin",
      )
    },
  )

  it("returns the normalized configured HTTPS origin", () => {
    expect(
      resolveInitialExportGuideAssetOrigin("https://assets.example.com/"),
    ).toBe("https://assets.example.com")
  })
})
