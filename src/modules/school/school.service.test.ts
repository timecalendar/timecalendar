import { NestExpressApplication } from "@nestjs/platform-express"
import createTestApp from "src/test-utils/create-test-app"
import { SchoolModule } from "./school.module"
import { SchoolService } from "./school.service"

describe("SchoolService", () => {
  let app: NestExpressApplication
  let service: SchoolService

  beforeAll(async () => {
    app = await createTestApp({ imports: [SchoolModule] })
    service = app.get(SchoolService)
  })

  describe("findAll", () => {
    it("returns no school", async () => {
      const schools = await service.findAll()
      expect(schools.length).toBe(0)
    })
  })
})
