import { classifyCalendarSourceHealth } from "modules/calendar/helpers/calendar-source-health.helper"
import {
  CalendarSourceHealthReason,
  CalendarSourceHealthStatus,
  CalendarSourceRecoveryAction,
  CalendarSourceRecoveryGuide,
} from "modules/calendar/models/source-health.model"

const NOW = new Date("2026-08-26T12:00:00.000Z")

const classify = (
  overrides: Partial<Parameters<typeof classifyCalendarSourceHealth>[0]> = {},
) =>
  classifyCalendarSourceHealth({
    sourceUrl:
      "https://calendar.example.test/export?firstDate=2025-09-01&lastDate=2026-06-30",
    schoolCode: "example",
    latestSuccessfulChangeAt: null,
    now: NOW,
    ...overrides,
  })

describe("classifyCalendarSourceHealth", () => {
  it("classifies an expired window with no later change as stale", () => {
    expect(classify()).toEqual({
      status: CalendarSourceHealthStatus.Stale,
      reason: CalendarSourceHealthReason.ExpiredExportWindow,
      recoveryAction: CalendarSourceRecoveryAction.ReAdd,
      guide: null,
    })
  })

  it("waits through the 14-day grace boundary", () => {
    expect(
      classify({
        sourceUrl: "https://calendar.example.test/export?lastDate=2026-08-12",
        now: new Date("2026-08-26T00:00:00.000Z"),
      }).status,
    ).toBe(CalendarSourceHealthStatus.Unknown)
    expect(
      classify({
        sourceUrl: "https://calendar.example.test/export?lastDate=2026-08-12",
        now: new Date("2026-08-26T00:00:00.001Z"),
      }).status,
    ).toBe(CalendarSourceHealthStatus.Stale)
  })

  it("does not flag when successful content changed after expiry plus grace", () => {
    expect(
      classify({
        latestSuccessfulChangeAt: new Date("2026-07-15T00:00:00.001Z"),
      }).status,
    ).toBe(CalendarSourceHealthStatus.Unknown)
  })

  it.each([
    "not-a-url",
    "https://calendar.example.test/export",
    "https://calendar.example.test/export?lastDate=2026-02-30",
    "https://calendar.example.test/export?lastDate=26-06-30",
  ])("degrades invalid or missing evidence to unknown", (sourceUrl) => {
    expect(classify({ sourceUrl }).status).toBe(
      CalendarSourceHealthStatus.Unknown,
    )
  })

  it("does not use change age alone", () => {
    expect(
      classify({
        sourceUrl: "https://calendar.example.test/export",
        latestSuccessfulChangeAt: new Date("2020-01-01T00:00:00.000Z"),
      }).status,
    ).toBe(CalendarSourceHealthStatus.Unknown)
  })

  it("recognizes the retired AMU host and 2025-26 window", () => {
    expect(
      classify({
        schoolCode: "univamu",
        sourceUrl:
          "https://ade-web-consult.univ-amu.fr/export?firstDate=2025-09-01&lastDate=2026-06-30",
        latestSuccessfulChangeAt: new Date("2026-08-01T00:00:00.000Z"),
      }),
    ).toEqual({
      status: CalendarSourceHealthStatus.Stale,
      reason: CalendarSourceHealthReason.KnownSourceTransition,
      recoveryAction: CalendarSourceRecoveryAction.ReAdd,
      guide: CalendarSourceRecoveryGuide.Amu20262027,
    })
  })

  it("treats AMU's current host as a healthy near miss", () => {
    expect(
      classify({
        schoolCode: "univamu",
        sourceUrl:
          "https://agenda-web-consult.univ-amu.fr/export?firstDate=2026-09-01&lastDate=2027-06-30",
      }).status,
    ).toBe(CalendarSourceHealthStatus.Healthy)
  })

  it.each([
    {
      schoolCode: "other",
      sourceUrl:
        "https://ade-web-consult.univ-amu.fr/export?firstDate=2025-09-01&lastDate=2026-06-30",
    },
    {
      schoolCode: "univamu",
      sourceUrl:
        "https://calendar.example.test/export?firstDate=2025-09-01&lastDate=2026-06-30",
    },
  ])("does not match AMU transition from partial identity", (overrides) => {
    expect(
      classify({
        ...overrides,
        latestSuccessfulChangeAt: new Date("2026-08-01T00:00:00.000Z"),
      }).reason,
    ).not.toBe(CalendarSourceHealthReason.KnownSourceTransition)
  })

  it("returns only the fixed privacy-safe metadata fields", () => {
    const result = classify()
    expect(Object.keys(result).sort()).toEqual(
      ["guide", "reason", "recoveryAction", "status"].sort(),
    )
    expect(JSON.stringify(result)).not.toMatch(/https|token|error|lastDate/)
  })
})
