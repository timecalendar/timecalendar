import { ArgumentMetadata, BadRequestException } from "@nestjs/common"
import {
  DEFAULT_SEARCH_LIMIT,
  SearchCalendarLogsV1Dto,
} from "modules/calendar-log/models/dto/search-calendar-logs-v1.dto"
import { CustomValidationPipe } from "modules/shared/pipes/custom-validation.pipe"

// Driven through the real pipe with the real options from configure-main-app,
// so these assertions cover the actual runtime path (whitelist, transform and
// class defaults included) rather than a hand-rolled validate() call.
const pipe = new CustomValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})

const metadata: ArgumentMetadata = {
  type: "body",
  metatype: SearchCalendarLogsV1Dto,
}

const validate = (body: unknown): Promise<SearchCalendarLogsV1Dto> =>
  pipe.transform(body, metadata)

const expectRejected = async (body: unknown) =>
  expect(validate(body)).rejects.toBeInstanceOf(BadRequestException)

describe("SearchCalendarLogsV1Dto", () => {
  describe("tokens", () => {
    it("accepts an array of non-empty strings", async () => {
      const dto = await validate({ tokens: ["a", "b"] })
      expect(dto.tokens).toEqual(["a", "b"])
    })

    it("accepts an empty array", async () => {
      const dto = await validate({ tokens: [] })
      expect(dto.tokens).toEqual([])
    })

    it("rejects a missing tokens field", () => expectRejected({}))

    it("rejects a bare string instead of an array", () =>
      expectRejected({ tokens: "some-token" }))

    it("rejects an empty string element", () =>
      expectRejected({ tokens: ["ok", ""] }))

    it("rejects a numeric element", () => expectRejected({ tokens: ["ok", 1] }))

    it("rejects a null element", () => expectRejected({ tokens: ["ok", null] }))

    it("collapses duplicates before the cap", async () => {
      const dto = await validate({
        tokens: Array.from({ length: 150 }, (_, i) => `token-${i % 3}`),
      })

      expect(dto.tokens).toEqual(["token-0", "token-1", "token-2"])
    })

    it("accepts exactly 100 unique tokens", async () => {
      const tokens = Array.from({ length: 100 }, (_, i) => `token-${i}`)
      const dto = await validate({ tokens })
      expect(dto.tokens).toHaveLength(100)
    })

    it("rejects 101 unique tokens", () =>
      expectRejected({
        tokens: Array.from({ length: 101 }, (_, i) => `token-${i}`),
      }))
  })

  describe("limit", () => {
    it("defaults to 50 when omitted", async () => {
      const dto = await validate({ tokens: [] })
      expect(dto.limit).toBe(DEFAULT_SEARCH_LIMIT)
    })

    it("accepts the range bounds", async () => {
      expect((await validate({ tokens: [], limit: 1 })).limit).toBe(1)
      expect((await validate({ tokens: [], limit: 100 })).limit).toBe(100)
    })

    it.each([0, 101, 1.5, "50", null])("rejects %p", (limit) =>
      expectRejected({ tokens: [], limit }),
    )
  })

  describe("cursor", () => {
    it("accepts a non-empty string", async () => {
      const dto = await validate({ tokens: [], cursor: "abc" })
      expect(dto.cursor).toBe("abc")
    })

    it("rejects an empty string", () =>
      expectRejected({ tokens: [], cursor: "" }))

    it("rejects a non-string", () => expectRejected({ tokens: [], cursor: 1 }))
  })

  describe("unreadSince", () => {
    it("accepts an ISO-8601 timestamp", async () => {
      const dto = await validate({
        tokens: [],
        unreadSince: "2026-08-29T18:20:25.641Z",
      })

      expect(dto.unreadSince).toBe("2026-08-29T18:20:25.641Z")
    })

    it.each(["not-a-date", "2026-13-45T00:00:00Z", 1756490425641])(
      "rejects %p",
      (unreadSince) => expectRejected({ tokens: [], unreadSince }),
    )
  })

  it("rejects unknown properties", () =>
    expectRejected({ tokens: [], offset: 10 }))
})
