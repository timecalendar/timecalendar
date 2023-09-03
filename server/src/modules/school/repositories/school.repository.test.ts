import { NestExpressApplication } from "@nestjs/platform-express"
import { schoolFactory } from "modules/school/factories/school.factory"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import { SchoolModule } from "modules/school/school.module"
import createTestApp from "test-utils/create-test-app"

describe("SchoolRepository", () => {
  let app: NestExpressApplication
  let repository: SchoolRepository

  beforeAll(async () => {
    app = await createTestApp({ imports: [SchoolModule] })
    repository = app.get(SchoolRepository)
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
})
