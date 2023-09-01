import { NestExpressApplication } from "@nestjs/platform-express"
import { schoolGroupFactory } from "modules/school-group/factories/school-group.factory"
import { SchoolGroup } from "modules/school-group/models/school-group.entity"
import { SchoolGroupModule } from "modules/school-group/school-group.module"
import { SchoolGroupService } from "modules/school-group/services/school-group.service"
import { schoolFactory } from "modules/school/factories/school.factory"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"

describe("SchoolService", () => {
  let app: NestExpressApplication
  let service: SchoolGroupService
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [SchoolGroupModule] })
    service = app.get(SchoolGroupService)
    dataSource = app.get(DataSource)
  })

  describe("findSchoolGroups", () => {
    it("returns school groups", async () => {
      const schoolGroup = await schoolGroupFactory().create({
        groups: [{ text: "Group 1", value: "1", children: [] }],
      })
      const result = await service.findSchoolGroups(schoolGroup.school.id)
      expect(result).toBeDefined()
      expect(result.groups[0].text).toBe("Group 1")
    })
  })

  describe("setSchoolGroups", () => {
    it("saves school groups", async () => {
      const school = await schoolFactory().create()

      await assertChanges(dataSource, [[SchoolGroup, 1]], () =>
        service.setSchoolGroups(school.id, {
          groups: [{ text: "Group 1", value: "1", children: [] }],
          icalUrl: "https://url.com",
        }),
      )
      const result = await dataSource
        .getRepository(SchoolGroup)
        .findOneByOrFail({ school: idToEntity(school.id) })
      expect(result.groups).toMatchObject([
        { text: "Group 1", value: "1", children: [] },
      ])
      expect(result.icalUrl).toBe("https://url.com")
    })
  })

  describe("getSchoolGroupsIcalUrl", () => {
    it("returns an URL from selected groups", async () => {
      const schoolGroup = await schoolGroupFactory().create()

      const { url } = await service.getSchoolGroupsIcalUrl(
        schoolGroup.school.id,
        { groups: ["1", "2", "3"] },
      )

      expect(url).toBe(
        "http://timecalendar.app/ical?project=1&resources=1,2,3&calType=ical&firstDate=2000-01-01&lastDate=2038-01-01",
      )
    })
  })
})
