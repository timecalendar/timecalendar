import {
  CALENDAR_NAME_MAX_LENGTH,
  normalizeCalendarName,
  trimCalendarName,
} from "modules/calendar/helpers/calendar-name"

describe("calendar-name", () => {
  describe("normalizeCalendarName", () => {
    it("collapses an absent name to the empty string", () => {
      expect(normalizeCalendarName(undefined)).toBe("")
      expect(normalizeCalendarName(null)).toBe("")
    })

    it("collapses a whitespace-only name to the empty string", () => {
      expect(normalizeCalendarName("   \t\n ")).toBe("")
    })

    it("trims surrounding whitespace", () => {
      expect(normalizeCalendarName("  My Calendar  ")).toBe("My Calendar")
    })

    it("collapses a non-string to the empty string", () => {
      expect(normalizeCalendarName(42)).toBe("")
    })
  })

  describe("trimCalendarName", () => {
    it("trims surrounding whitespace", () => {
      expect(trimCalendarName("  My Calendar  ")).toBe("My Calendar")
    })

    it("passes a non-string through unchanged so @IsString() can reject it", () => {
      expect(trimCalendarName(42)).toBe(42)
      expect(trimCalendarName(null)).toBeNull()
      expect(trimCalendarName(undefined)).toBeUndefined()
    })
  })

  it("bounds a calendar name at 100 characters", () => {
    expect(CALENDAR_NAME_MAX_LENGTH).toBe(100)
  })
})
