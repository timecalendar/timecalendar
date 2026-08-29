import { Logger } from "@nestjs/common"
import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { calendarLogFactory } from "modules/calendar-log/factories/calendar-log.factory"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import { DataSource } from "typeorm"
import createTestApp from "test-utils/create-test-app"

const SEARCH = "/v1/calendar-logs/search"

const encodePayload = (payload: unknown) =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")

describe("CalendarLogV1Controller", () => {
  let app: NestExpressApplication
  let repository: CalendarLogRepository
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarLogModule] })
    repository = app.get(CalendarLogRepository)
    dataSource = app.get(DataSource)
  })

  const search = (body: object) => request(app).post(SEARCH).send(body)

  /** Explicit `createdAt`, so ordering assertions do not race the clock. */
  const createLogAt = async (calendar: Calendar, createdAt: string) => {
    const log = await calendarLogFactory().calendar(calendar.id).create()
    await dataSource.query(
      `UPDATE "calendar_log" SET "createdAt" = CAST($1 AS timestamp) WHERE "id" = $2`,
      [createdAt, log.id],
    )
    return log.id
  }

  describe("paging", () => {
    it("returns the newest page with a cursor when more rows exist", async () => {
      const calendar = await calendarFactory().create()
      const newest = await createLogAt(calendar, "2026-08-01 10:00:03")
      const middle = await createLogAt(calendar, "2026-08-01 10:00:02")
      await createLogAt(calendar, "2026-08-01 10:00:01")

      const { body } = await search({
        tokens: [calendar.token],
        limit: 2,
      }).expect(200)

      expect(body.items.map((item: { id: string }) => item.id)).toEqual([
        newest,
        middle,
      ])
      expect(body.nextCursor).toEqual(expect.any(String))
      expect(body.asOf).toEqual(expect.any(String))
    })

    it("continues from a cursor and ends with a null cursor", async () => {
      const calendar = await calendarFactory().create()
      const ids = [
        await createLogAt(calendar, "2026-08-01 10:00:03"),
        await createLogAt(calendar, "2026-08-01 10:00:02"),
        await createLogAt(calendar, "2026-08-01 10:00:01"),
      ]

      const first = await search({ tokens: [calendar.token], limit: 2 }).expect(
        200,
      )

      const second = await search({
        tokens: [calendar.token],
        limit: 2,
        cursor: first.body.nextCursor,
      }).expect(200)

      expect(second.body.items.map((i: { id: string }) => i.id)).toEqual([
        ids[2],
      ])
      expect(second.body.nextCursor).toBeNull()
      // The following page stays inside the first page's snapshot.
      expect(second.body.asOf).toBe(first.body.asOf)
    })

    it("returns a null cursor when the whole result fits in one page", async () => {
      const calendar = await calendarFactory().create()
      await createLogAt(calendar, "2026-08-01 10:00:01")

      const { body } = await search({
        tokens: [calendar.token],
        limit: 50,
      }).expect(200)

      expect(body.items).toHaveLength(1)
      expect(body.nextCursor).toBeNull()
    })

    it("orders strictly by createdAt DESC across calendars", async () => {
      const a = await calendarFactory().create()
      const b = await calendarFactory().create()
      const first = await createLogAt(a, "2026-08-01 10:00:03")
      const second = await createLogAt(b, "2026-08-01 10:00:02")
      const third = await createLogAt(a, "2026-08-01 10:00:01")

      const { body } = await search({ tokens: [a.token, b.token] }).expect(200)

      expect(body.items.map((i: { id: string }) => i.id)).toEqual([
        first,
        second,
        third,
      ])
    })

    it("defaults the page size to 50", async () => {
      const calendar = await calendarFactory().create()
      const spy = jest.spyOn(repository, "searchPage")

      try {
        await search({ tokens: [calendar.token] }).expect(200)
        // 50 plus the one extra row that decides whether a next page exists.
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ limit: 51 }))
      } finally {
        spy.mockRestore()
      }
    })

    // A log arriving mid-scroll may neither appear in the chain nor displace a
    // row the reader has already seen.
    it("is stable when a log is inserted between page requests", async () => {
      const calendar = await calendarFactory().create()
      const ids = [
        await createLogAt(calendar, "2026-08-01 10:00:03"),
        await createLogAt(calendar, "2026-08-01 10:00:02"),
        await createLogAt(calendar, "2026-08-01 10:00:01"),
      ]

      const first = await search({ tokens: [calendar.token], limit: 2 }).expect(
        200,
      )

      // Newer than the snapshot: left on DEFAULT now().
      const inserted = await calendarLogFactory().calendar(calendar.id).create()

      const second = await search({
        tokens: [calendar.token],
        limit: 2,
        cursor: first.body.nextCursor,
      }).expect(200)

      const firstIds = first.body.items.map((i: { id: string }) => i.id)
      const secondIds = second.body.items.map((i: { id: string }) => i.id)

      expect(firstIds).toEqual([ids[0], ids[1]])
      expect(secondIds).toEqual([ids[2]])
      expect(firstIds.concat(secondIds)).not.toContain(inserted.id)
      // No row is duplicated or displaced across the boundary.
      expect(new Set(firstIds.concat(secondIds)).size).toBe(3)
    })
  })

  describe("tokens", () => {
    it("returns an empty page without querying calendar logs", async () => {
      const pageSpy = jest.spyOn(repository, "searchPage")
      const countSpy = jest.spyOn(repository, "countSince")

      try {
        const { body } = await search({ tokens: [] }).expect(200)

        expect(body.items).toEqual([])
        expect(body.nextCursor).toBeNull()
        expect(body.asOf).toEqual(expect.any(String))
        expect(body.unreadCount).toBe(0)
        expect(pageSpy).not.toHaveBeenCalled()
        expect(countSpy).not.toHaveBeenCalled()
      } finally {
        pageSpy.mockRestore()
        countSpy.mockRestore()
      }
    })

    it("returns unreadCount 0 for an empty array carrying a watermark", async () => {
      const countSpy = jest.spyOn(repository, "countSince")

      try {
        const { body } = await search({
          tokens: [],
          unreadSince: "2026-08-01T00:00:00.000Z",
        }).expect(200)

        expect(body.unreadCount).toBe(0)
        expect(countSpy).not.toHaveBeenCalled()
      } finally {
        countSpy.mockRestore()
      }
    })

    it("treats an unknown token as contributing no rows", async () => {
      const { body } = await search({ tokens: ["nope-1", "nope-2"] }).expect(
        200,
      )

      expect(body.items).toEqual([])
      expect(body.nextCursor).toBeNull()
    })

    it("returns only known tokens' rows when mixed with unknown ones", async () => {
      const calendar = await calendarFactory().create()
      const known = await createLogAt(calendar, "2026-08-01 10:00:01")

      const { body } = await search({
        tokens: [calendar.token, "nope"],
      }).expect(200)

      expect(body.items.map((i: { id: string }) => i.id)).toEqual([known])
    })

    it("collapses duplicate tokens instead of duplicating rows", async () => {
      const calendar = await calendarFactory().create()
      const log = await createLogAt(calendar, "2026-08-01 10:00:01")

      const { body } = await search({
        tokens: [calendar.token, calendar.token, calendar.token],
      }).expect(200)

      expect(body.items.map((i: { id: string }) => i.id)).toEqual([log])
    })

    it("accepts 150 entries that collapse to 3 unique tokens", async () => {
      const calendars = await Promise.all([
        calendarFactory().create(),
        calendarFactory().create(),
        calendarFactory().create(),
      ])
      const tokens = Array.from(
        { length: 150 },
        (_, i) => calendars[i % 3].token,
      )

      await search({ tokens }).expect(200)
    })

    it("rejects more than 100 unique tokens", () =>
      search({
        tokens: Array.from({ length: 101 }, (_, i) => `token-${i}`),
      }).expect(400))

    it("rejects a bare string where an array is required", () =>
      search({ tokens: "some-token" }).expect(400))

    it("rejects a missing tokens field", () => search({}).expect(400))

    it("rejects an empty-string element", () =>
      search({ tokens: [""] }).expect(400))
  })

  describe("validation", () => {
    it.each([0, 101, 1.5, "50", null])("rejects limit %p", (limit) =>
      search({ tokens: [], limit }).expect(400),
    )

    it.each(["not-a-date", "2026-13-45T00:00:00Z"])(
      "rejects unreadSince %p",
      (unreadSince) => search({ tokens: [], unreadSince }).expect(400),
    )

    it("rejects a malformed cursor", () =>
      search({ tokens: [], cursor: "!!!not-base64!!!" }).expect(400))

    it("rejects an unsupported cursor version", () =>
      search({
        tokens: [],
        cursor: encodePayload({
          v: 2,
          a: "2026-08-01 10:00:00",
          c: "2026-08-01 10:00:00",
          i: "3f1d9a20-1f1e-4a5b-9c7d-8e2b6a4c1d05",
        }),
      }).expect(400))

    it("does not echo the submitted cursor in the 400 body", async () => {
      const cursor = encodePayload({ v: 9, a: "x", c: "y", i: "z" })
      const { body } = await search({ tokens: [], cursor }).expect(400)

      expect(JSON.stringify(body)).not.toContain(cursor)
    })
  })

  describe("response shape", () => {
    it("omits calendarToken from every item and from the whole body", async () => {
      const calendar = await calendarFactory().create()
      await createLogAt(calendar, "2026-08-01 10:00:01")

      const response = await search({ tokens: [calendar.token] }).expect(200)

      expect(response.body.items).toHaveLength(1)
      expect("calendarToken" in response.body.items[0]).toBe(false)
      expect(Object.keys(response.body.items[0]).sort()).toEqual([
        "calendarChange",
        "calendarId",
        "calendarName",
        "createdAt",
        "id",
        "updatedAt",
      ])
      // The token string appears nowhere in the serialized response.
      expect(response.text).not.toContain(calendar.token)
    })
  })

  describe("unread count", () => {
    it("counts rows after the watermark and at or before the snapshot", async () => {
      const calendar = await calendarFactory().create()
      await createLogAt(calendar, "2026-08-01 09:00:00")
      await createLogAt(calendar, "2026-08-01 11:00:00")
      await createLogAt(calendar, "2026-08-01 12:00:00")

      const { body } = await search({
        tokens: [calendar.token],
        unreadSince: "2026-08-01T10:00:00.000Z",
      }).expect(200)

      expect(body.unreadCount).toBe(2)
    })

    it("excludes rows belonging to calendars outside the requested tokens", async () => {
      const mine = await calendarFactory().create()
      const other = await calendarFactory().create()
      await createLogAt(mine, "2026-08-01 11:00:00")
      await createLogAt(other, "2026-08-01 11:00:00")

      const { body } = await search({
        tokens: [mine.token],
        unreadSince: "2026-08-01T10:00:00.000Z",
      }).expect(200)

      expect(body.unreadCount).toBe(1)
    })

    it("omits the count on a following page and runs no count query", async () => {
      const calendar = await calendarFactory().create()
      await createLogAt(calendar, "2026-08-01 10:00:02")
      await createLogAt(calendar, "2026-08-01 10:00:01")

      const first = await search({ tokens: [calendar.token], limit: 1 }).expect(
        200,
      )

      const countSpy = jest.spyOn(repository, "countSince")
      try {
        const { body } = await search({
          tokens: [calendar.token],
          limit: 1,
          cursor: first.body.nextCursor,
          unreadSince: "2026-08-01T00:00:00.000Z",
        }).expect(200)

        expect("unreadCount" in body).toBe(false)
        expect(countSpy).not.toHaveBeenCalled()
      } finally {
        countSpy.mockRestore()
      }
    })
  })

  // The privacy negatives the Reviewer checks. `sanitizeLog` redacts UUIDs and
  // credentials, but a calendar token is an opaque string with no shape a regex
  // recognises — so the guarantee is that nothing on this path logs at all.
  describe("privacy", () => {
    const captureLogs = () => {
      const lines: unknown[][] = []
      const levels = ["error", "warn", "log", "debug", "verbose"] as const
      const spies = levels.map((level) =>
        jest
          .spyOn(Logger.prototype, level)
          .mockImplementation((...args: unknown[]) => {
            lines.push(args)
          }),
      )
      const statics = levels.map((level) =>
        jest.spyOn(Logger, level).mockImplementation((...args: unknown[]) => {
          lines.push(args)
        }),
      )

      return {
        lines,
        restore: () => [...spies, ...statics].forEach((s) => s.mockRestore()),
      }
    }

    it("logs nothing sensitive when the repository fails", async () => {
      const calendar = await calendarFactory().create()
      const failure = jest
        .spyOn(repository, "searchPage")
        .mockRejectedValue(new Error("connection reset"))
      const logs = captureLogs()

      try {
        await search({ tokens: [calendar.token] }).expect(500)

        const emitted = JSON.stringify(logs.lines)
        expect(emitted).not.toContain(calendar.token)
        expect(emitted).not.toContain("Old Event")
        expect(emitted).not.toContain("New Event")
        expect(emitted).not.toContain("Test Location")
      } finally {
        logs.restore()
        failure.mockRestore()
      }
    })

    it("surfaces a repository failure as the standard sanitized 5xx", async () => {
      const calendar = await calendarFactory().create()
      const failure = jest
        .spyOn(repository, "searchPage")
        .mockRejectedValue(new Error("connection reset"))
      const logs = captureLogs()

      try {
        const { body } = await search({ tokens: [calendar.token] }).expect(500)

        expect(body).toEqual({
          statusCode: 500,
          message: "Internal server error",
        })
        expect(JSON.stringify(body)).not.toContain("connection reset")
      } finally {
        logs.restore()
        failure.mockRestore()
      }
    })

    it("logs neither tokens nor the cursor when validation fails", async () => {
      const token = "secret-token-value-9f2b"
      const cursor = encodePayload({ v: 7, a: "x", c: "y", i: "z" })
      const logs = captureLogs()

      try {
        await search({ tokens: token }).expect(400)
        await search({ tokens: [token], cursor }).expect(400)

        const emitted = JSON.stringify(logs.lines)
        expect(emitted).not.toContain(token)
        expect(emitted).not.toContain(cursor)
      } finally {
        logs.restore()
      }
    })
  })
})
