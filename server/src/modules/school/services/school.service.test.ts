import { NestExpressApplication } from "@nestjs/platform-express"
import { schoolFactory } from "modules/school/factories/school.factory"
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
})
