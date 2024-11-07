import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { calendarLogFactory } from "modules/calendar-log/factories/calendar-log.factory"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import createTestApp from "test-utils/create-test-app"
import { DataSource, Repository } from "typeorm"

describe("CalendarLogEntity", () => {
  let app: NestExpressApplication
  let dataSource: DataSource
  let repository: Repository<CalendarLog>

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarLogModule] })
    dataSource = app.get(DataSource)
    repository = dataSource.getRepository(CalendarLog)
  })

  describe("create", () => {
    it("creates a calendar log", async () => {
      const created = await calendarLogFactory().newItem().create()

      const log = await repository.findOneByOrFail({ id: created.id })

      expect(log).toBeDefined()
    })
  })
})
