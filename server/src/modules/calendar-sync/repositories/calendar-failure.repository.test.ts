import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { CalendarFailure } from "modules/calendar-sync/models/calendar-failure.entity"
import { CalendarFailureRepository } from "modules/calendar-sync/repositories/calendar-failure.repository"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"

describe("CalendarFailureRepository", () => {
  let app: NestExpressApplication
  let repository: CalendarFailureRepository

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarSyncModule] })
    repository = app.get(CalendarFailureRepository)
  })

  describe("create", () => {
    it("creates a calendar failure", async () => {
      const calendar = await assertChanges(
        app.get(DataSource),
        [[CalendarFailure, 1]],
        () => repository.create("https://calendar.com", "Error"),
      )
      expect(calendar.id).toBeDefined()
    })
  })
})
