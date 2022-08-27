import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { schoolGroupFactory } from "modules/school-group/factories/school-group.factory"
import { SchoolGroup } from "modules/school-group/models/school-group.entity"
import { SchoolGroupModule } from "modules/school-group/school-group.module"
import { schoolFactory } from "modules/school/factories/school.factory"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"

describe("CalendarSyncController", () => {
  let app: NestExpressApplication
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [SchoolGroupModule] })
    dataSource = app.get(DataSource)
  })

  describe("GET /schools/:schoolId/school-group", () => {
    it("returns school groups", async () => {
      const schoolGroup = await schoolGroupFactory().create({
        groups: [{ text: "Group 1", value: "1", children: [] }],
      })
      const { body } = await request(app)
        .get(`/schools/${schoolGroup.school.id}/school-group`)
        .expect(200)
      expect(body).toBeDefined()
      expect(body.groups[0].text).toBe("Group 1")
    })
  })

  describe("PUT /schools/:schoolId/school-group", () => {
    it("saves school groups", async () => {
      const school = await schoolFactory().create()
      await assertChanges(dataSource, [[SchoolGroup, 1]], () =>
        request(app)
          .put(`/schools/${school.id}/school-group`)
          .send({
            groups: [{ text: "Group 1", value: "1", children: [] }],
            icalUrl: "https://url.com",
          })
          .expect(200),
      )
    })
  })

  describe("POST /schools/:schoolId/school-group/ical", () => {
    it("returns an URL from selected groups", async () => {
      const schoolGroup = await schoolGroupFactory().create()

      const { body } = await request(app)
        .post(`/schools/${schoolGroup.school.id}/school-group/ical`)
        .send({ groups: ["1", "2", "3"] })
        .expect(201)

      expect(body.url).toBe(
        "http://timecalendar.app/ical?project=1&resources=1,2,3&calType=ical&firstDate=2000-01-01&lastDate=2038-01-01",
      )
    })
  })
})
