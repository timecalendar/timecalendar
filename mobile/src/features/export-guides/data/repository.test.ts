import { customFetchResponse } from "@/api/mutator"
import * as storage from "@/storage"

import {
  EXPORT_GUIDE_ASSET_ORIGINS,
  EXPORT_GUIDE_MAX_AGE_MS,
} from "./constants"
import type { ExportGuideClock } from "./registry"
import {
  exportGuideCacheKey,
  resetExportGuideCacheObservationsForTests,
} from "./registry"
import { createExportGuideRepository } from "./repository"
import { resolveExportGuideProvider } from "./resolver"

jest.mock("@/api/mutator", () => {
  const actual = jest.requireActual("@/api/mutator")
  return { ...actual, customFetchResponse: jest.fn() }
})

const responseMock = customFetchResponse as jest.MockedFunction<
  typeof customFetchResponse
>

const active = { kind: "active" } as const
const exact = {
  kind: "exact",
  catalogueVersion: "2026-09-07.1",
} as const

const catalogue = (locale: "fr" | "en" = "en", version = "2026-09-07.1") => ({
  schemaVersion: 1,
  catalogueVersion: version,
  locale,
  providers: [
    {
      slug: "generic",
      label: "Other",
      kind: "pages",
      selectable: true,
      compatibility: { minClientSchema: 1, maxClientSchema: 1 },
      pages: [
        {
          title: "Distinctive private title",
          description: "Distinctive private guide copy",
          image: {
            url: `${EXPORT_GUIDE_ASSET_ORIGINS[0]}/private-image.png`,
            mimeType: "image/png",
            byteSize: 1,
            width: 1,
            height: 1,
            altText: "Distinctive private alt",
          },
        },
      ],
    },
  ],
})

const catalogueWithRejectedProvider = (
  rejection: "unknown_kind" | "incompatible" | "invalid",
) => ({
  ...catalogue(),
  providers: [
    {
      ...catalogue().providers[0],
      slug: "future-provider",
      ...(rejection === "unknown_kind" ? { kind: "video" } : {}),
      ...(rejection === "incompatible"
        ? { compatibility: { minClientSchema: 2, maxClientSchema: 2 } }
        : {}),
      ...(rejection === "invalid" ? { pages: [] } : {}),
    },
    ...catalogue().providers,
  ],
})

const apiResponse = (
  status: number,
  data: unknown,
  headers: HeadersInit = {
    ETag: '"strong-etag"',
    "Content-Language": "en",
  },
) => ({ status, data, headers: new Headers(headers) })

const createClock = (wall = 1_000_000, monotonic = 100) => {
  const state = { wall, monotonic }
  const clock: ExportGuideClock = {
    wallNow: () => state.wall,
    monotonicNow: () => state.monotonic,
  }
  return { state, clock }
}

beforeEach(() => {
  responseMock.mockReset()
  storage.remove(storage.STORAGE_KEYS.exportGuideLkgRegistry)
  resetExportGuideCacheObservationsForTests()
})

describe("export-guide repository", () => {
  it("accepts a strict 200, atomically stores it, then sends its ETag for a strict 304", async () => {
    const { state, clock } = createClock()
    const repository = createExportGuideRepository(clock)
    responseMock.mockResolvedValueOnce(apiResponse(200, catalogue()))

    await expect(
      repository.load({ locale: "en", selector: active }),
    ).resolves.toEqual(
      expect.objectContaining({
        source: "network",
        catalogue: expect.any(Object),
      }),
    )
    const firstRegistry = storage.getString(
      storage.STORAGE_KEYS.exportGuideLkgRegistry,
    )
    expect(firstRegistry).toBeDefined()
    expect(firstRegistry).not.toMatch(
      /draft|selectedProvider|pageIndex|completion|routeState/,
    )

    state.wall += 5000
    state.monotonic += 5000
    responseMock.mockResolvedValueOnce(apiResponse(304, undefined))
    await expect(
      repository.load({ locale: "en", selector: active }),
    ).resolves.toEqual(expect.objectContaining({ source: "not_modified" }))
    expect(responseMock).toHaveBeenLastCalledWith(
      "/v1/export-guides?locale=en&clientSchema=1",
      { headers: { "If-None-Match": '"strong-etag"' }, method: "GET" },
    )
    expect(
      storage.getString(storage.STORAGE_KEYS.exportGuideLkgRegistry),
    ).not.toBe(firstRegistry)
  })

  it.each(["unknown_kind", "incompatible", "invalid"] as const)(
    "preserves the %s resolver reason through 304 and LKG cache reads",
    async (reason) => {
      const repository = createExportGuideRepository()
      responseMock.mockResolvedValueOnce(
        apiResponse(200, catalogueWithRejectedProvider(reason)),
      )
      await repository.load({ locale: "en", selector: active })

      responseMock.mockResolvedValueOnce(apiResponse(304, undefined))
      const notModified = await repository.load({
        locale: "en",
        selector: active,
      })
      if (notModified.source === "none") throw new Error("expected catalogue")
      expect(notModified.source).toBe("not_modified")
      expect(
        resolveExportGuideProvider(notModified.catalogue, "future-provider")
          .reason,
      ).toBe(reason)

      responseMock.mockRejectedValueOnce(new Error("offline"))
      const lkg = await repository.load({ locale: "en", selector: active })
      if (lkg.source === "none") throw new Error("expected LKG")
      expect(lkg.source).toBe("lkg")
      expect(
        resolveExportGuideProvider(lkg.catalogue, "future-provider").reason,
      ).toBe(reason)
    },
  )

  it.each([
    ["missing ETag", { "Content-Language": "en" }, "etag_mismatch"],
    [
      "weak ETag",
      { ETag: 'W/"weak"', "Content-Language": "en" },
      "etag_mismatch",
    ],
    [
      "wrong language",
      { ETag: '"strong"', "Content-Language": "fr" },
      "language_mismatch",
    ],
  ])("rejects a 200 with %s", async (_name, headers, failure) => {
    responseMock.mockResolvedValueOnce(apiResponse(200, catalogue(), headers))
    await expect(
      createExportGuideRepository().load({ locale: "en", selector: active }),
    ).resolves.toEqual({ source: "none", failure })
  })

  it.each([
    ["body", apiResponse(304, { unexpected: true }), "malformed"],
    [
      "missing ETag",
      apiResponse(304, undefined, { "Content-Language": "en" }),
      "etag_mismatch",
    ],
    [
      "different ETag",
      apiResponse(304, undefined, {
        ETag: '"different"',
        "Content-Language": "en",
      }),
      "etag_mismatch",
    ],
    [
      "wrong language",
      apiResponse(304, undefined, {
        ETag: '"strong-etag"',
        "Content-Language": "fr",
      }),
      "language_mismatch",
    ],
  ])(
    "treats a 304 with %s only as an ordinary LKG fallback",
    async (_name, response, failure) => {
      const repository = createExportGuideRepository()
      responseMock.mockResolvedValueOnce(apiResponse(200, catalogue()))
      await repository.load({ locale: "en", selector: active })
      responseMock.mockResolvedValueOnce(response)
      await expect(
        repository.load({ locale: "en", selector: active }),
      ).resolves.toEqual(expect.objectContaining({ source: "lkg", failure }))
    },
  )

  it.each([
    [new Error("private network details"), "network"],
    [Object.assign(new Error("aborted"), { name: "AbortError" }), "timeout"],
    [
      new (jest.requireActual("@/api/mutator").ApiTransportError)(
        "malformed_body",
      ),
      "malformed",
    ],
    [
      new (jest.requireActual("@/api/mutator").ApiTransportError)(
        "oversized_body",
      ),
      "oversized",
    ],
  ])(
    "classifies thrown transport input without exposing it",
    async (error, failure) => {
      responseMock.mockRejectedValueOnce(error)
      const outcome = await createExportGuideRepository().load({
        locale: "en",
        selector: active,
      })
      expect(outcome).toEqual({ source: "none", failure })
      expect(JSON.stringify(outcome)).not.toMatch(/private|aborted/)
    },
  )

  it("distinguishes caller cancellation from timeout", async () => {
    const controller = new AbortController()
    controller.abort()
    responseMock.mockRejectedValueOnce(
      Object.assign(new Error("aborted"), { name: "AbortError" }),
    )
    await expect(
      createExportGuideRepository().load({
        locale: "en",
        selector: active,
        signal: controller.signal,
      }),
    ).resolves.toEqual({ source: "none", failure: "caller_cancelled" })
  })

  it.each([
    [404, "http"],
    [503, "http"],
    [200, "empty"],
  ])("fails closed for response %s", async (status, failure) => {
    responseMock.mockResolvedValueOnce(
      apiResponse(status, status === 200 ? undefined : { message: "private" }),
    )
    await expect(
      createExportGuideRepository().load({ locale: "en", selector: active }),
    ).resolves.toEqual({ source: "none", failure })
  })

  it("uses only a matching fresh record at the inclusive 24-hour boundary", async () => {
    const { state, clock } = createClock()
    const repository = createExportGuideRepository(clock)
    responseMock.mockResolvedValueOnce(apiResponse(200, catalogue()))
    await repository.load({ locale: "en", selector: active })

    for (const [age, source] of [
      [EXPORT_GUIDE_MAX_AGE_MS - 1, "lkg"],
      [EXPORT_GUIDE_MAX_AGE_MS, "lkg"],
      [EXPORT_GUIDE_MAX_AGE_MS + 1, "none"],
    ] as const) {
      state.monotonic = 100 + age
      state.wall = -10_000
      responseMock.mockRejectedValueOnce(new Error("offline"))
      await expect(
        repository.load({ locale: "en", selector: active }),
      ).resolves.toEqual(expect.objectContaining({ source }))
    }
  })

  it("keeps active, exact, and locales isolated", async () => {
    const repository = createExportGuideRepository()
    responseMock
      .mockResolvedValueOnce(apiResponse(200, catalogue()))
      .mockRejectedValue(new Error("offline"))
    await repository.load({ locale: "en", selector: active })
    await expect(
      repository.load({ locale: "en", selector: exact }),
    ).resolves.toEqual({ source: "none", failure: "network" })
    await expect(
      repository.load({ locale: "fr", selector: active }),
    ).resolves.toEqual({ source: "none", failure: "network" })
  })

  it("accepts exact responses only at the requested version", async () => {
    responseMock.mockResolvedValueOnce(
      apiResponse(200, catalogue("en", "other")),
    )
    await expect(
      createExportGuideRepository().load({ locale: "en", selector: exact }),
    ).resolves.toEqual({ source: "none", failure: "version_mismatch" })
  })

  it("rejects an invalid exact selector before issuing a request", async () => {
    await expect(
      createExportGuideRepository().load({
        locale: "en",
        selector: { kind: "exact", catalogueVersion: "été" },
      }),
    ).resolves.toEqual({ source: "none", failure: "version_mismatch" })
    expect(responseMock).not.toHaveBeenCalled()
  })

  it("classifies invalid envelopes and unusable Generic without leaking payloads", async () => {
    const log = jest.spyOn(console, "log").mockImplementation()
    responseMock
      .mockResolvedValueOnce(
        apiResponse(200, { ...catalogue(), schemaVersion: 2 }),
      )
      .mockResolvedValueOnce(
        apiResponse(200, {
          ...catalogue(),
          providers: [{ ...catalogue().providers[0], slug: "ade" }],
        }),
      )
    const repository = createExportGuideRepository()
    await expect(
      repository.load({ locale: "en", selector: active }),
    ).resolves.toEqual({ source: "none", failure: "unsupported_schema" })
    await expect(
      repository.load({ locale: "en", selector: active }),
    ).resolves.toEqual({ source: "none", failure: "invalid_generic" })
    responseMock.mockResolvedValueOnce(
      apiResponse(200, {
        ...catalogue(),
        providers: [
          { ...catalogue().providers[0], slug: "ade" },
          { ...catalogue().providers[0], slug: "ade" },
          catalogue().providers[0],
        ],
      }),
    )
    await expect(
      repository.load({ locale: "en", selector: active }),
    ).resolves.toEqual({ source: "none", failure: "invalid_envelope" })
    expect(JSON.stringify(log.mock.calls)).not.toMatch(
      /Distinctive private|private-image|strong-etag/,
    )
    log.mockRestore()
  })

  it("keeps an accepted pinned snapshot isolated from later cache replacement", async () => {
    const repository = createExportGuideRepository()
    responseMock.mockResolvedValueOnce(apiResponse(200, catalogue()))
    const first = await repository.load({ locale: "en", selector: active })
    if (first.source === "none") throw new Error("expected catalogue")
    const snapshot = resolveExportGuideProvider(
      first.catalogue,
      "generic",
    ).snapshot

    responseMock.mockResolvedValueOnce(
      apiResponse(200, {
        ...catalogue("en", "2026-09-07.2"),
        providers: [
          {
            ...catalogue().providers[0],
            label: "Replacement",
            pages: [{ title: "Replacement", description: "New copy" }],
          },
        ],
      }),
    )
    await repository.load({ locale: "en", selector: active })
    expect(snapshot.catalogueVersion).toBe("2026-09-07.1")
    expect(snapshot.providerLabel).toBe("Other")
    expect(snapshot.pages[0]?.title).toBe("Distinctive private title")
  })

  it("keeps the prior record usable when an atomic storage write throws", async () => {
    const repository = createExportGuideRepository()
    responseMock.mockResolvedValueOnce(apiResponse(200, catalogue()))
    await repository.load({ locale: "en", selector: active })
    const previous = storage.getString(
      storage.STORAGE_KEYS.exportGuideLkgRegistry,
    )
    const write = jest
      .spyOn(storage, "setString")
      .mockImplementationOnce(() => {
        throw new Error("private storage message")
      })
    responseMock.mockResolvedValueOnce(
      apiResponse(200, catalogue("en", "2026-09-07.2")),
    )
    await expect(
      repository.load({ locale: "en", selector: active }),
    ).resolves.toEqual(
      expect.objectContaining({ source: "lkg", failure: "storage" }),
    )
    expect(storage.getString(storage.STORAGE_KEYS.exportGuideLkgRegistry)).toBe(
      previous,
    )
    write.mockRestore()
  })

  it("bounds a storage read failure instead of throwing", async () => {
    const read = jest.spyOn(storage, "getString").mockImplementationOnce(() => {
      throw new Error("private storage read")
    })
    await expect(
      createExportGuideRepository().load({ locale: "en", selector: active }),
    ).resolves.toEqual({ source: "none", failure: "storage" })
    expect(responseMock).not.toHaveBeenCalled()
    read.mockRestore()
  })

  it("rejects corrupt, negative-age, and foreign registry candidates", async () => {
    const { clock } = createClock(1000, 10)
    for (const raw of [
      "not json",
      JSON.stringify({ version: 2, records: {} }),
      JSON.stringify({
        version: 1,
        records: {
          [exportGuideCacheKey("en", active)]: {
            version: 1,
            requestedLocale: "fr",
          },
        },
      }),
    ]) {
      storage.setString(storage.STORAGE_KEYS.exportGuideLkgRegistry, raw)
      responseMock.mockRejectedValueOnce(new Error("offline"))
      await expect(
        createExportGuideRepository(clock).load({
          locale: "en",
          selector: active,
        }),
      ).resolves.toEqual({ source: "none", failure: "network" })
    }
  })

  it("uses monotonic live age and documented wall fallback after observation reset", async () => {
    const { state, clock } = createClock(1_000_000, 100)
    const repository = createExportGuideRepository(clock)
    responseMock.mockResolvedValueOnce(apiResponse(200, catalogue()))
    await repository.load({ locale: "en", selector: active })

    state.wall += EXPORT_GUIDE_MAX_AGE_MS * 10
    state.monotonic += 1
    responseMock.mockRejectedValueOnce(new Error("offline"))
    await expect(
      repository.load({ locale: "en", selector: active }),
    ).resolves.toEqual(expect.objectContaining({ source: "lkg" }))

    state.wall = 500_000
    state.monotonic = 100 + EXPORT_GUIDE_MAX_AGE_MS + 1
    responseMock.mockRejectedValueOnce(new Error("offline"))
    await expect(
      repository.load({ locale: "en", selector: active }),
    ).resolves.toEqual({ source: "none", failure: "network" })

    resetExportGuideCacheObservationsForTests()
    state.wall = 1_000_000 + EXPORT_GUIDE_MAX_AGE_MS - 500_000
    state.monotonic = 1
    responseMock.mockRejectedValueOnce(new Error("offline"))
    await expect(
      createExportGuideRepository(clock).load({
        locale: "en",
        selector: active,
      }),
    ).resolves.toEqual(expect.objectContaining({ source: "lkg" }))

    resetExportGuideCacheObservationsForTests()
    state.wall = 999_999
    responseMock.mockRejectedValueOnce(new Error("offline"))
    await expect(
      createExportGuideRepository(clock).load({
        locale: "en",
        selector: active,
      }),
    ).resolves.toEqual({ source: "none", failure: "network" })
  })
})
