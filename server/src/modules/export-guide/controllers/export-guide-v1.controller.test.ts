import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { ExportGuideModule } from "modules/export-guide/export-guide.module"
import {
  EXPORT_GUIDE_CATALOGUE_DIRECTORY,
  ExportGuideCatalogueStore,
} from "modules/export-guide/stores/export-guide-catalogue.store"
import {
  EXPORT_GUIDE_UNAVAILABLE_MESSAGE,
  ExportGuideService,
} from "modules/export-guide/services/export-guide.service"
import { FeatureFlagService } from "modules/feature-flag/services/feature-flag.service"
import createTestApp from "test-utils/create-test-app"

describe("ExportGuideV1Controller", () => {
  let app: NestExpressApplication
  let enabled = true
  const directory = mkdtempSync(join(tmpdir(), "export-guide-controller-"))
  const evaluateFlag = jest.fn(async () => enabled)

  beforeAll(async () => {
    app = await createTestApp(
      { imports: [ExportGuideModule] },
      {
        overrides: [
          {
            provide: FeatureFlagService,
            useValue: { evaluateFlag },
          },
          { provide: EXPORT_GUIDE_CATALOGUE_DIRECTORY, useValue: directory },
        ],
      },
    )
  })

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  beforeEach(() => {
    enabled = true
    evaluateFlag.mockImplementation(async () => enabled)
  })

  const get = (query = "locale=fr&clientSchema=1") =>
    request(app).get(`/v1/export-guides?${query}`)

  it("boots with a controller-local v1 route and returns exact active locale", async () => {
    const { body, headers } = await get().expect(200)
    expect(body).toMatchObject({ schemaVersion: 1, locale: "fr" })
    expect(headers["content-language"]).toBe("fr")
    expect(headers.etag).toMatch(/^"[a-f0-9]{64}"$/)
    expect(evaluateFlag).toHaveBeenCalledWith("export-guides-v1", false)
    await request(app)
      .get("/export-guides?locale=fr&clientSchema=1")
      .expect(404)
  })

  it("returns a retained exact version and never substitutes an absent version", async () => {
    const repository = app.get(ExportGuideCatalogueStore)
    const version = repository.capture().activeVersion
    const { body } = await get(
      `locale=en&clientSchema=1&catalogueVersion=${encodeURIComponent(
        version!,
      )}`,
    ).expect(200)
    expect(body.locale).toBe("en")
    expect(body.catalogueVersion).toBe(version)
    await get("locale=en&clientSchema=1&catalogueVersion=absent").expect(404)
  })

  it.each([
    "clientSchema=1",
    "locale=de&clientSchema=1",
    "locale=fr",
    "locale=fr&clientSchema=1.0",
    "locale=fr&clientSchema=2",
    "locale=fr&clientSchema=one",
    "locale=fr&clientSchema=1&catalogueVersion=",
  ])("rejects invalid exact negotiation: %s", async (query) => {
    await get(query).expect(400)
  })

  it("returns bodyless 304 with the same strong validator and language", async () => {
    const first = await get().expect(200)
    const response = await get()
      .set("If-None-Match", `"foreign", ${first.headers.etag}`)
      .expect(304)
    expect(response.text).toBe("")
    expect(response.headers.etag).toBe(first.headers.etag)
    expect(response.headers["content-language"]).toBe("fr")
  })

  it.each(['W/"foreign"', 'W/"placeholder"', '"foreign"', "*"])(
    "does not match weak or foreign validator %s",
    async (etag) => {
      await get().set("If-None-Match", etag).expect(200)
    },
  )

  it("keeps byte and ETag output stable and locale-specific", async () => {
    const first = await get().expect(200)
    const repeated = await get().expect(200)
    const english = await get("locale=en&clientSchema=1").expect(200)
    expect(repeated.text).toBe(first.text)
    expect(repeated.headers.etag).toBe(first.headers.etag)
    expect(english.headers.etag).not.toBe(first.headers.etag)
    expect(Buffer.byteLength(first.text, "utf8")).toBeLessThanOrEqual(
      512 * 1024,
    )
  })

  it("fails closed with a sanitized response when disabled", async () => {
    enabled = false
    const { body } = await get().expect(503)
    expect(body.message).toBe(EXPORT_GUIDE_UNAVAILABLE_MESSAGE)
    expect(body).not.toHaveProperty("providers")
  })

  it("fails closed when flag evaluation throws or is malformed", async () => {
    evaluateFlag.mockRejectedValueOnce(new Error("provider detail"))
    await get().expect(503)
    evaluateFlag.mockResolvedValueOnce("true" as never)
    await get().expect(503)
  })

  it("sanitizes repository failures", async () => {
    const repository = app.get(ExportGuideCatalogueStore)
    const spy = jest.spyOn(repository, "find").mockImplementationOnce(() => {
      throw new Error("storage detail")
    })
    const { body } = await get().expect(503)
    expect(JSON.stringify(body)).not.toContain("storage detail")
    spy.mockRestore()
  })

  it("fails closed when the active snapshot is absent", async () => {
    const repository = app.get(ExportGuideCatalogueStore)
    const spy = jest.spyOn(repository, "find").mockReturnValueOnce(undefined)
    await get().expect(503)
    spy.mockRestore()
  })

  it("requires no authentication header", async () => {
    await get().expect(200)
  })

  it("uses the cached exact serialization from the service", async () => {
    const service = app.get(ExportGuideService)
    const first = await service.get("fr", 1)
    const second = await service.get("fr", 1)
    expect(second).toBe(first)
  })
})
