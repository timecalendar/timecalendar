import { EXPORT_GUIDE_ASSET_ORIGINS } from "./constants"
import { parseExportGuideCatalogue } from "./parser"

const assetOrigin = EXPORT_GUIDE_ASSET_ORIGINS[0]

const image = (overrides: Record<string, unknown> = {}) => ({
  url: `${assetOrigin}/export-guides/v1/page.png`,
  mimeType: "image/png",
  byteSize: 1024,
  width: 800,
  height: 600,
  altText: "Export menu",
  ...overrides,
})

const provider = (slug: string, overrides: Record<string, unknown> = {}) => ({
  slug,
  label: slug === "generic" ? "Other" : "Provider",
  kind: "pages",
  selectable: true,
  compatibility: { minClientSchema: 1, maxClientSchema: 1 },
  thumbnail: image({ byteSize: 256 * 1024 }),
  pages: [
    {
      title: "Open export",
      description: "Copy the calendar URL.",
      image: image({ byteSize: 1024 * 1024 }),
    },
  ],
  ...overrides,
})

const catalogue = () => ({
  schemaVersion: 1,
  catalogueVersion: "2026-09-07.1",
  locale: "en",
  providers: [provider("future-provider"), provider("generic")],
})

const parse = (value: unknown, exact = false) =>
  parseExportGuideCatalogue(value, {
    requestedLocale: "en",
    selector: exact
      ? { kind: "exact", catalogueVersion: "2026-09-07.1" }
      : { kind: "active" },
  })

describe("parseExportGuideCatalogue", () => {
  it("copies and recursively freezes a valid future-provider catalogue in server order", () => {
    const input = catalogue()
    Object.assign(input, { futureEnvelopeField: true })
    Object.assign(input.providers[0]!, { futureProviderField: "ignored" })

    const result = parse(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.catalogue.providers.map(({ slug }) => slug)).toEqual([
      "future-provider",
      "generic",
    ])
    expect(result.catalogue).not.toBe(input)
    expect(result.catalogue.providers[0]).not.toBe(input.providers[0])
    input.providers[0]!.pages[0]!.title = "mutated"
    expect(result.catalogue.providers[0]?.pages[0]?.title).toBe("Open export")
    expect(Object.isFrozen(result.catalogue)).toBe(true)
    expect(Object.isFrozen(result.catalogue.providers)).toBe(true)
    expect(
      Object.isFrozen(result.catalogue.providers[0]?.pages[0]?.image),
    ).toBe(true)
    expect("futureEnvelopeField" in result.catalogue).toBe(false)
  })

  it.each([
    ["null envelope", null, "invalid_envelope"],
    ["array envelope", [], "invalid_envelope"],
    [
      "unknown schema",
      { ...catalogue(), schemaVersion: 2 },
      "unsupported_schema",
    ],
    ["wrong locale", { ...catalogue(), locale: "fr" }, "locale_mismatch"],
    [
      "empty version",
      { ...catalogue(), catalogueVersion: "" },
      "invalid_envelope",
    ],
    [
      "non-ASCII version",
      { ...catalogue(), catalogueVersion: "été" },
      "invalid_envelope",
    ],
    [
      "version too long",
      { ...catalogue(), catalogueVersion: "x".repeat(129) },
      "invalid_envelope",
    ],
    ["no providers", { ...catalogue(), providers: [] }, "invalid_envelope"],
    [
      "too many providers",
      {
        ...catalogue(),
        providers: Array.from({ length: 51 }, (_, index) =>
          provider(index === 50 ? "generic" : `p-${index}`),
        ),
      },
      "invalid_envelope",
    ],
    [
      "duplicate valid slug",
      {
        ...catalogue(),
        providers: [provider("ade"), provider("ade"), provider("generic")],
      },
      "invalid_envelope",
    ],
  ])("rejects %s", (_name, value, failure) => {
    expect(parse(value)).toEqual({ ok: false, failure })
  })

  it("enforces exact catalogue versions", () => {
    expect(
      parseExportGuideCatalogue(catalogue(), {
        requestedLocale: "en",
        selector: { kind: "exact", catalogueVersion: "different" },
      }),
    ).toEqual({ ok: false, failure: "version_mismatch" })
    expect(parse(catalogue(), true).ok).toBe(true)
  })

  it("accepts the body byte boundary and rejects the next byte and multibyte overflow", () => {
    expect(
      parseExportGuideCatalogue(catalogue(), {
        requestedLocale: "en",
        selector: { kind: "active" },
        encodedBodyBytes: 512 * 1024,
      }).ok,
    ).toBe(true)
    expect(
      parseExportGuideCatalogue(catalogue(), {
        requestedLocale: "en",
        selector: { kind: "active" },
        encodedBodyBytes: 512 * 1024 + 1,
      }),
    ).toEqual({ ok: false, failure: "oversized" })
    expect(parse({ ...catalogue(), ignored: "é".repeat(256 * 1024) })).toEqual({
      ok: false,
      failure: "oversized",
    })
  })

  it("total-rejects a cyclic input that cannot be measured", () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(parse(cyclic)).toEqual({ ok: false, failure: "invalid_envelope" })
  })

  it("isolates a non-object optional provider", () => {
    const result = parse({
      ...catalogue(),
      providers: [null, provider("generic")],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.catalogue.providers).toHaveLength(1)
  })

  it("rejects duplicate rejected provider slugs", () => {
    expect(
      parse({
        ...catalogue(),
        providers: [
          provider("future", { kind: "video" }),
          provider("future", { kind: "video" }),
          provider("generic"),
        ],
      }),
    ).toEqual({ ok: false, failure: "invalid_envelope" })
  })

  it.each([
    ["label empty", { label: "" }],
    ["label too long", { label: "x".repeat(81) }],
    ["label untrimmed", { label: " Provider" }],
    ["selectable non-boolean", { selectable: 1 }],
    [
      "compatibility fractional",
      { compatibility: { minClientSchema: 1.5, maxClientSchema: 2 } },
    ],
    [
      "compatibility reversed",
      { compatibility: { minClientSchema: 2, maxClientSchema: 1 } },
    ],
    ["pages empty", { pages: [] }],
    [
      "pages too many",
      { pages: Array.from({ length: 21 }, () => provider("x").pages[0]) },
    ],
    ["title empty", { pages: [{ title: "", description: "copy" }] }],
    [
      "title too long",
      { pages: [{ title: "x".repeat(121), description: "copy" }] },
    ],
    ["description empty", { pages: [{ title: "title", description: "" }] }],
    [
      "description too long",
      { pages: [{ title: "title", description: "x".repeat(2001) }] },
    ],
  ])("isolates a non-Generic provider with %s", (_name, overrides) => {
    const input = catalogue()
    input.providers[0] = provider("future-provider", overrides)
    const result = parse(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.catalogue.providers.map(({ slug }) => slug)).toEqual([
      "generic",
    ])
    expect(result.catalogue.rejectedProviders).toEqual({
      "future-provider": "invalid",
    })
  })

  it.each([
    ["unknown kind", { kind: "video" }, "unknown_kind"],
    [
      "minimum too high",
      { compatibility: { minClientSchema: 2, maxClientSchema: 2 } },
      "incompatible",
    ],
  ])(
    "classifies %s without rejecting the catalogue",
    (_name, overrides, reason) => {
      const input = catalogue()
      input.providers[0] = provider("future-provider", overrides)
      const result = parse(input)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.catalogue.rejectedProviders["future-provider"]).toBe(reason)
    },
  )

  it.each([
    ["missing", [provider("ade")]],
    ["unknown kind", [provider("generic", { kind: "video" })]],
    [
      "incompatible",
      [
        provider("generic", {
          compatibility: { minClientSchema: 2, maxClientSchema: 2 },
        }),
      ],
    ],
    ["non-selectable", [provider("generic", { selectable: false })]],
    ["empty pages", [provider("generic", { pages: [] })]],
    ["malformed", [provider("generic", { label: "" })]],
    ["duplicate", [provider("generic"), provider("generic")]],
  ])(
    "invalidates the entire catalogue when Generic is %s",
    (_name, providers) => {
      expect(parse({ ...catalogue(), providers })).toEqual({
        ok: false,
        failure: "invalid_generic",
      })
    },
  )

  it.each([
    ["foreign origin", { url: "https://example.com/page.png" }],
    ["malformed URL", { url: "not a URL" }],
    ["HTTP", { url: `${assetOrigin.replace("https:", "http:")}/page.png` }],
    [
      "credentials",
      { url: `https://user:pass@${new URL(assetOrigin).host}/page.png` },
    ],
    ["query", { url: `${assetOrigin}/page.png?token=secret` }],
    ["fragment", { url: `${assetOrigin}/page.png#secret` }],
    ["default port", { url: `${assetOrigin}:443/page.png` }],
    ["URL too long", { url: `${assetOrigin}/${"x".repeat(2048)}` }],
    ["unsupported MIME", { mimeType: "image/gif" }],
    ["zero bytes", { byteSize: 0 }],
    ["thumbnail bytes", { byteSize: 256 * 1024 + 1 }],
    ["zero width", { width: 0 }],
    ["wide", { width: 4097 }],
    ["tall", { height: 4097 }],
    ["pixel ceiling", { width: 4096, height: 2049 }],
    ["empty alt", { altText: "" }],
    ["long alt", { altText: "x".repeat(501) }],
    ["empty caption", { caption: "" }],
    ["long caption", { caption: "x".repeat(501) }],
  ])("isolates image with %s", (_name, overrides) => {
    const input = catalogue()
    input.providers[0] = provider("future-provider", {
      thumbnail: image(overrides),
    })
    const result = parse(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.catalogue.rejectedProviders["future-provider"]).toBe(
      "invalid",
    )
  })

  it("accepts all supported image MIME types and exact metadata bounds", () => {
    for (const mimeType of ["image/png", "image/jpeg", "image/webp"]) {
      const input = catalogue()
      input.providers[0] = provider("future-provider", {
        thumbnail: image({ mimeType, byteSize: 1, width: 1, height: 1 }),
        pages: [
          {
            title: "x".repeat(120),
            description: "x".repeat(2000),
            image: image({
              mimeType,
              byteSize: 1024 * 1024,
              caption: "caption",
            }),
          },
        ],
      })
      expect(parse(input).ok).toBe(true)
    }
  })
})
