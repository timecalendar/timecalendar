import { BadRequestException } from "@nestjs/common"
import {
  CalendarLogCursor,
  decodeCursor,
  encodeCursor,
  timestampTextToDate,
} from "modules/calendar-log/models/calendar-log-cursor"

const cursor: CalendarLogCursor = {
  asOfText: "2026-08-29 18:22:06.641234",
  createdAtText: "2026-08-29 18:20:25.142981",
  id: "3f1d9a20-1f1e-4a5b-9c7d-8e2b6a4c1d05",
}

const encodePayload = (payload: unknown) =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")

describe("calendar log cursor", () => {
  describe("round trip", () => {
    it("preserves microsecond precision", () => {
      expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor)
    })

    it("preserves a whole-second timestamp with no fraction", () => {
      const noFraction: CalendarLogCursor = {
        ...cursor,
        createdAtText: "2026-08-29 18:20:25",
      }

      expect(decodeCursor(encodeCursor(noFraction))).toEqual(noFraction)
    })

    it("emits a url-safe token", () => {
      expect(encodeCursor(cursor)).toMatch(/^[A-Za-z0-9_-]+$/)
    })
  })

  describe("rejection", () => {
    const expectRejected = (value: string) =>
      expect(() => decodeCursor(value)).toThrow(BadRequestException)

    it("rejects a non-base64url value", () => expectRejected("not base64!!"))

    it("rejects valid base64 that is not JSON", () =>
      expectRejected(Buffer.from("not json", "utf8").toString("base64url")))

    it("rejects a JSON array", () => expectRejected(encodePayload([1, 2, 3])))

    it("rejects a JSON scalar", () => expectRejected(encodePayload("string")))

    it("rejects null", () => expectRejected(encodePayload(null)))

    it("rejects an unsupported version", () =>
      expectRejected(
        encodePayload({
          v: 2,
          a: cursor.asOfText,
          c: cursor.createdAtText,
          i: cursor.id,
        }),
      ))

    it("rejects a missing id", () =>
      expectRejected(
        encodePayload({ v: 1, a: cursor.asOfText, c: cursor.createdAtText }),
      ))

    it("rejects a missing snapshot", () =>
      expectRejected(
        encodePayload({ v: 1, c: cursor.createdAtText, i: cursor.id }),
      ))

    it("rejects a malformed snapshot timestamp", () =>
      expectRejected(
        encodePayload({
          v: 1,
          a: "2026-13-45",
          c: cursor.createdAtText,
          i: cursor.id,
        }),
      ))

    it("rejects a shape-valid but impossible snapshot timestamp", () =>
      expectRejected(
        encodePayload({
          v: 1,
          a: "2026-99-99 99:99:99.999999",
          c: cursor.createdAtText,
          i: cursor.id,
        }),
      ))

    it("rejects a shape-valid but impossible anchor timestamp", () =>
      expectRejected(
        encodePayload({
          v: 1,
          a: cursor.asOfText,
          c: "2026-02-29 18:20:25.142981",
          i: cursor.id,
        }),
      ))

    it("rejects a sub-microsecond fraction", () =>
      expectRejected(
        encodePayload({
          v: 1,
          a: cursor.asOfText,
          c: "2026-08-29 18:20:25.1234567",
          i: cursor.id,
        }),
      ))

    it("rejects a non-uuid id", () =>
      expectRejected(
        encodePayload({
          v: 1,
          a: cursor.asOfText,
          c: cursor.createdAtText,
          i: "not-a-uuid",
        }),
      ))

    it("rejects a SQL fragment in a timestamp field", () =>
      expectRejected(
        encodePayload({
          v: 1,
          a: "2026-08-29 18:22:06' OR '1'='1",
          c: cursor.createdAtText,
          i: cursor.id,
        }),
      ))

    it("never echoes the submitted cursor or its decoded fields", () => {
      const forged = encodePayload({
        v: 9,
        a: cursor.asOfText,
        c: cursor.createdAtText,
        i: cursor.id,
      })

      expect.assertions(5)
      try {
        decodeCursor(forged)
      } catch (error) {
        const serialized = JSON.stringify(
          (error as BadRequestException).getResponse(),
        )
        expect(serialized).not.toContain(forged)
        expect(serialized).not.toContain(cursor.asOfText)
        expect(serialized).not.toContain(cursor.createdAtText)
        expect(serialized).not.toContain(cursor.id)
        expect(serialized).toContain("Invalid cursor")
      }
    })
  })

  // Privacy negative (task 2.3): the cursor is issued from a row that carries a
  // token and event content; none of it may survive into the encoded value.
  describe("privacy", () => {
    it("carries no token and no event content", () => {
      const token = "cal-token-8f2c4b1a"
      const issued = encodeCursor({
        asOfText: cursor.asOfText,
        createdAtText: cursor.createdAtText,
        id: cursor.id,
      })

      const decoded = Buffer.from(issued, "base64url").toString("utf8")

      expect(decoded).not.toContain(token)
      expect(decoded).not.toContain("Cours de Mathématiques")
      expect(decoded).not.toContain("Amphi B")
      expect(decoded).not.toContain("event-uid-1")
      expect(Object.keys(JSON.parse(decoded)).sort()).toEqual([
        "a",
        "c",
        "i",
        "v",
      ])
    })
  })

  describe("timestampTextToDate", () => {
    it("truncates microseconds to milliseconds", () => {
      expect(
        timestampTextToDate("2026-08-29 18:22:06.641234").toISOString(),
      ).toBe("2026-08-29T18:22:06.641Z")
    })

    it("pads a short fraction", () => {
      expect(timestampTextToDate("2026-08-29 18:22:06.5").toISOString()).toBe(
        "2026-08-29T18:22:06.500Z",
      )
    })

    it("handles a missing fraction", () => {
      expect(timestampTextToDate("2026-08-29 18:22:06").toISOString()).toBe(
        "2026-08-29T18:22:06.000Z",
      )
    })
  })
})
