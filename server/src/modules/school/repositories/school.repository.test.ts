import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { NestExpressApplication } from "@nestjs/platform-express"
import { EXPORT_GUIDE_CATALOGUE_DIRECTORY } from "modules/export-guide/stores/export-guide-catalogue.store"
import { schoolFactory } from "modules/school/factories/school.factory"
import { schoolProfileFactory } from "modules/school/factories/school-profile.factory"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import { SchoolModule } from "modules/school/school.module"
import createTestApp from "test-utils/create-test-app"

describe("SchoolRepository", () => {
  let app: NestExpressApplication
  let repository: SchoolRepository
  const catalogueDirectory = mkdtempSync(
    join(tmpdir(), "school-repository-export-guides-"),
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
    repository = app.get(SchoolRepository)
  })

  afterAll(() => {
    rmSync(catalogueDirectory, { recursive: true, force: true })
  })

  describe("findAll", () => {
    it("returns no school", async () => {
      const schools = await repository.findAll()
      expect(schools.length).toBe(0)
    })

    it("returns a school", async () => {
      await schoolFactory().create()
      const schools = await repository.findAll()
      expect(schools.length).toBe(1)
      expect(schools[0].name).toBe("My Gaming Academia")
    })

    it("does not return hidden schools", async () => {
      await schoolFactory().create({ visible: false })
      const schools = await repository.findAll()
      expect(schools.length).toBe(0)
    })

    it("returns schools ordered by name", async () => {
      await schoolFactory().create({ name: "Z" })
      await schoolFactory().create({ name: "A" })
      const schools = await repository.findAll()
      expect(schools.length).toBe(2)
      expect(schools[0].name).toBe("A")
      expect(schools[1].name).toBe("Z")
    })
  })

  describe("search", () => {
    it("returns no school when no match", async () => {
      await schoolFactory().create({ seoUrl: "different-url" })
      const schools = await repository.search({ seoUrl: "test-url" })
      expect(schools.length).toBe(0)
    })

    it("returns a school matching seoUrl", async () => {
      await schoolFactory().create({ seoUrl: "test-url" })
      const schools = await repository.search({ seoUrl: "test-url" })
      expect(schools.length).toBe(1)
      expect(schools[0].name).toBe("My Gaming Academia")
      expect(schools[0].seoUrl).toBe("test-url")
      expect(schools[0].profile).toBeNull() // No profile associated
    })

    it("does not return hidden schools", async () => {
      await schoolFactory().create({ seoUrl: "test-url", visible: false })
      const schools = await repository.search({ seoUrl: "test-url" })
      expect(schools.length).toBe(0)
    })

    it("returns multiple schools with same seoUrl", async () => {
      await schoolFactory().create({ seoUrl: "test-url", name: "School A" })
      await schoolFactory().create({ seoUrl: "test-url", name: "School B" })
      await schoolFactory().create({
        seoUrl: "different-url",
        name: "School C",
      })
      const schools = await repository.search({ seoUrl: "test-url" })
      expect(schools.length).toBe(2)
      expect(schools.map((s) => s.name).sort()).toEqual([
        "School A",
        "School B",
      ])
    })

    it("returns school with profile when profile exists", async () => {
      const school = await schoolFactory().create({ seoUrl: "test-url" })
      await schoolProfileFactory().associations({ school }).create()
      const schools = await repository.search({ seoUrl: "test-url" })
      expect(schools.length).toBe(1)
      expect(schools[0].name).toBe("My Gaming Academia")
      expect(schools[0].profile).toBeDefined()
    })
  })
})
