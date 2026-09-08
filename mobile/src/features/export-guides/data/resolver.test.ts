import { EXPORT_GUIDE_ASSET_ORIGINS } from "./constants"
import { parseExportGuideCatalogue } from "./parser"
import {
  getSelectableExportGuideProviders,
  resolveExportGuideProvider,
} from "./resolver"

const provider = (slug: string, overrides: Record<string, unknown> = {}) => ({
  slug,
  label: slug,
  kind: "pages",
  selectable: true,
  compatibility: { minClientSchema: 1, maxClientSchema: 1 },
  pages: [
    {
      title: `${slug} title`,
      description: `${slug} copy`,
      image: {
        url: `${EXPORT_GUIDE_ASSET_ORIGINS[0]}/${slug}.png`,
        mimeType: "image/png",
        byteSize: 1,
        width: 1,
        height: 1,
        altText: `${slug} alt`,
      },
    },
  ],
  ...overrides,
})

const parsed = (providers: unknown[]) => {
  const result = parseExportGuideCatalogue(
    {
      schemaVersion: 1,
      catalogueVersion: "v1",
      locale: "en",
      providers,
    },
    { requestedLocale: "en", selector: { kind: "active" } },
  )
  if (!result.ok) throw new Error(result.failure)
  return result.catalogue
}

describe("export-guide resolver", () => {
  it("projects selectable compatible providers in server order without an allowlist", () => {
    const catalogue = parsed([
      provider("later-provider"),
      provider("hidden", { selectable: false }),
      provider("generic"),
    ])
    expect(
      getSelectableExportGuideProviders(catalogue).map(({ slug }) => slug),
    ).toEqual(["later-provider", "generic"])
  })

  it.each([
    ["later-provider", "exact", "later-provider"],
    ["generic", "generic", "generic"],
    ["absent", "missing", "generic"],
    ["unknown", "unknown_kind", "generic"],
    ["incompatible", "incompatible", "generic"],
    ["invalid", "invalid", "generic"],
    ["NOT VALID", "missing", "generic"],
  ])("resolves %s with %s", (requested, reason, resolved) => {
    const catalogue = parsed([
      provider("later-provider"),
      provider("unknown", { kind: "video" }),
      provider("incompatible", {
        compatibility: { minClientSchema: 2, maxClientSchema: 2 },
      }),
      provider("invalid", { pages: [] }),
      provider("generic"),
    ])
    const result = resolveExportGuideProvider(catalogue, requested)
    expect(result.reason).toBe(reason)
    expect(result.provider.slug).toBe(resolved)
    expect(result.snapshot).toEqual(
      expect.objectContaining({
        providerSlug: resolved,
        reason,
        locale: "en",
        catalogueVersion: "v1",
      }),
    )
  })

  it("returns a copied frozen snapshot isolated from source mutation", () => {
    const input = provider("generic")
    const catalogue = parsed([input])
    const resolution = resolveExportGuideProvider(catalogue, "generic")
    input.pages[0]!.title = "changed"
    expect(resolution.snapshot.pages[0]?.title).toBe("generic title")
    expect(Object.isFrozen(resolution)).toBe(true)
    expect(Object.isFrozen(resolution.snapshot.pages[0]?.image)).toBe(true)
  })

  it("copies pages both without images and with image captions", () => {
    const generic = provider("generic", {
      pages: [
        { title: "Text", description: "Text only" },
        {
          title: "Captioned",
          description: "Image copy",
          image: {
            url: `${EXPORT_GUIDE_ASSET_ORIGINS[0]}/captioned.png`,
            mimeType: "image/webp",
            byteSize: 1,
            width: 1,
            height: 1,
            altText: "Captioned alt",
            caption: "Visible caption",
          },
        },
      ],
    })
    const snapshot = resolveExportGuideProvider(
      parsed([generic]),
      "generic",
    ).snapshot
    expect(snapshot.pages).toEqual(generic.pages)
    expect(snapshot.pages).not.toBe(generic.pages)
  })

  it("rejects an object that bypassed the parser without Generic", () => {
    expect(() =>
      resolveExportGuideProvider(
        { ...parsed([provider("generic")]), providers: [] },
        "generic",
      ),
    ).toThrow("no Generic")
  })
})
