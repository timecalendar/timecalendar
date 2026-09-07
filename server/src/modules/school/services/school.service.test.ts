import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { NestExpressApplication } from "@nestjs/platform-express"
import {
  EXPORT_GUIDE_CATALOGUE_DIRECTORY,
  ExportGuideCatalogueStore,
} from "modules/export-guide/stores/export-guide-catalogue.store"
import { schoolFactory } from "modules/school/factories/school.factory"
import { schoolProfileFactory } from "modules/school/factories/school-profile.factory"
import { SchoolModule } from "modules/school/school.module"
import { SchoolService } from "modules/school/services/school.service"
import createTestApp from "test-utils/create-test-app"

describe("SchoolService", () => {
  let app: NestExpressApplication
  let service: SchoolService
  const catalogueDirectory = mkdtempSync(
    join(tmpdir(), "school-service-export-guides-"),
  )

  beforeAll(async () => {
    app = await createTestApp(
      { imports: [SchoolModule] },
      {
        overrides: [
          {
            provide: EXPORT_GUIDE_CATALOGUE_DIRECTORY,
            useValue: catalogueDirectory,
          },
        ],
      },
    )
    service = app.get(SchoolService)
  })

  afterAll(() => {
    rmSync(catalogueDirectory, { recursive: true, force: true })
  })

  describe("findSchools", () => {
    it("returns a school", async () => {
      await schoolFactory().create()
      const { schools } = await service.findSchools()
      expect(schools.length).toBe(1)
      expect(schools[0].name).toBe("My Gaming Academia")
      expect(schools[0].imageUrlDark).toBeNull()
      expect(schools[0].exportGuide).toMatchObject({
        providerSlug: "groups",
        catalogueVersion: expect.any(String),
      })
    })

    it("captures one catalogue snapshot for every row", async () => {
      await schoolFactory().create({ name: "School A" })
      await schoolFactory().create({ name: "School B" })
      const versions = (await service.findSchools()).schools.map(
        ({ exportGuide }) => exportGuide.catalogueVersion,
      )
      expect(new Set(versions).size).toBe(1)
    })

    it("fails closed when no active snapshot is available", async () => {
      const repository = app.get(ExportGuideCatalogueStore)
      const spy = jest.spyOn(repository, "capture").mockReturnValueOnce({
        retained: repository.capture().retained,
      })
      await expect(service.findSchools()).rejects.toThrow(
        "Export-guide snapshot unavailable",
      )
      spy.mockRestore()
    })
  })

  describe("findSchool", () => {
    it("returns a school", async () => {
      const school = await schoolFactory().create()
      const result = await service.findSchool(school.id)
      expect(result.name).toBe("My Gaming Academia")
    })
  })

  describe("searchSchools", () => {
    it("returns no schools when no match", async () => {
      await schoolFactory().create({ seoUrl: "different-url" })
      const result = await service.searchSchools({ seoUrl: "test-url" })
      expect(result.length).toBe(0)
    })

    it("returns a school matching seoUrl", async () => {
      await schoolFactory().create({ seoUrl: "test-url" })
      const result = await service.searchSchools({ seoUrl: "test-url" })
      expect(result.length).toBe(1)
      expect(result[0].name).toBe("My Gaming Academia")
      expect(result[0].seoUrl).toBe("test-url")
    })

    it("does not return hidden schools", async () => {
      await schoolFactory().create({ seoUrl: "test-url", visible: false })
      const result = await service.searchSchools({ seoUrl: "test-url" })
      expect(result.length).toBe(0)
    })

    it("returns multiple schools with same seoUrl", async () => {
      await schoolFactory().create({ seoUrl: "test-url", name: "School A" })
      await schoolFactory().create({ seoUrl: "test-url", name: "School B" })
      await schoolFactory().create({
        seoUrl: "different-url",
        name: "School C",
      })
      const result = await service.searchSchools({ seoUrl: "test-url" })
      expect(result.length).toBe(2)
      expect(result.map((s) => s.name).sort()).toEqual(["School A", "School B"])
    })

    it("transforms school data correctly", async () => {
      await schoolFactory().create({
        seoUrl: "test-url",
        name: "Test School",
        imageUrl: "test-image.jpg",
        imageUrlDark: "test-image-dark.jpg",
        assistant: "groups",
        fallbackAssistant: "select",
      })
      const result = await service.searchSchools({ seoUrl: "test-url" })
      expect(result.length).toBe(1)
      expect(result[0]).toMatchObject({
        name: "Test School",
        seoUrl: "test-url",
        assistant: expect.objectContaining({ slug: "groups" }),
        fallbackAssistant: expect.objectContaining({ slug: "select" }),
      })
      expect(result[0].imageUrl).toContain("test-image.jpg")
      expect(result[0].imageUrlDark).toContain("test-image-dark.jpg")
    })

    it("returns school with profile when profile exists", async () => {
      const school = await schoolFactory().create({ seoUrl: "test-url" })
      await schoolProfileFactory().associations({ school }).create()
      const result = await service.searchSchools({ seoUrl: "test-url" })
      expect(result.length).toBe(1)
      expect(result[0].profile).toBeDefined()
      expect(result[0].profile?.campuses).toHaveLength(2)
      expect(result[0].profile?.formations).toContain("Informatique")
    })
  })
})
