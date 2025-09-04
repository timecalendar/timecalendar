import { NestExpressApplication } from "@nestjs/platform-express"
import { schoolFactory } from "modules/school/factories/school.factory"
import { schoolProfileFactory } from "modules/school/factories/school-profile.factory"
import { SchoolModule } from "modules/school/school.module"
import { SchoolService } from "modules/school/services/school.service"
import createTestApp from "test-utils/create-test-app"

describe("SchoolService", () => {
  let app: NestExpressApplication
  let service: SchoolService

  beforeAll(async () => {
    app = await createTestApp({ imports: [SchoolModule] })
    service = app.get(SchoolService)
  })

  describe("findSchools", () => {
    it("returns a school", async () => {
      await schoolFactory().create()
      const { schools } = await service.findSchools()
      expect(schools.length).toBe(1)
      expect(schools[0].name).toBe("My Gaming Academia")
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
