import { NestExpressApplication } from "@nestjs/platform-express"
import { schoolGroupFactory } from "modules/school-group/factories/school-group.factory"
import { SchoolGroup } from "modules/school-group/models/school-group.entity"
import { SchoolGroupRepository } from "modules/school-group/repositories/school-group.repository"
import { SchoolGroupModule } from "modules/school-group/school-group.module"
import { schoolFactory } from "modules/school/factories/school.factory"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"
import { v4 } from "uuid"

describe("SchoolGroupRepository", () => {
  let app: NestExpressApplication
  let repository: SchoolGroupRepository
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [SchoolGroupModule] })
    repository = app.get(SchoolGroupRepository)
    dataSource = app.get(DataSource)
  })

  describe("findAll", () => {
    it("returns no school group", async () => {
      const promise = repository.findOne(v4())
      await expect(promise).rejects.toThrow()
    })

    it("returns school groups", async () => {
      const schoolGroup = await schoolGroupFactory().create({
        groups: [{ text: "Group 1", value: "1", children: [] }],
      })
      const result = await repository.findOne(schoolGroup.school.id)
      expect(result).toBeDefined()
      expect(result.groups[0].text).toBe("Group 1")
    })

    it("does not return other school groups", async () => {
      await schoolGroupFactory().create({
        groups: [{ text: "Group 1", value: "1", children: [] }],
      })
      const anotherSchool = await schoolFactory().create()

      const promise = repository.findOne(anotherSchool.id)
      await expect(promise).rejects.toThrow()
    })
  })

  describe("save", () => {
    it("saves an existing school group", async () => {
      const schoolGroup = await schoolGroupFactory().create()

      await assertChanges(dataSource, [[SchoolGroup, 0]], () =>
        repository.save(schoolGroup.school.id, {
          groups: [{ text: "Group 1", value: "1", children: [] }],
          icalUrl: "https://url.com",
        }),
      )
      const result = await dataSource
        .getRepository(SchoolGroup)
        .findOneByOrFail({ id: schoolGroup.id })
      expect(result.groups).toMatchObject([
        { text: "Group 1", value: "1", children: [] },
      ])
      expect(result.icalUrl).toBe("https://url.com")
    })

    it("creates a school group", async () => {
      const school = await schoolFactory().create()

      await assertChanges(dataSource, [[SchoolGroup, 1]], () =>
        repository.save(school.id, {
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
})
