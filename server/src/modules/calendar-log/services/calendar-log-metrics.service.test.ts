import { createMock } from "@golevelup/ts-jest"
import { BadRequestException } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { CalendarLogMapper } from "modules/calendar-log/mappers/calendar-log.mapper"
import {
  encodeCursor,
  timestampTextToDate,
} from "modules/calendar-log/models/calendar-log-cursor"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import { CalendarLogMetricsService } from "modules/calendar-log/services/calendar-log-metrics.service"
import { CalendarLogService } from "modules/calendar-log/services/calendar-log.service"

interface Measurement {
  instrument: string
  value: number
  attributes?: Record<string, unknown>
}

// `mock`-prefixed so jest's hoist plugin allows the factory to close over it.
// Nothing dereferences it during module load — only when an instrument is used.
const mockMeasurements: Measurement[] = []

jest.mock("config/observability/meter", () => {
  const capture =
    (instrument: string) =>
    (value: number, attributes?: Record<string, unknown>) => {
      mockMeasurements.push({ instrument, value, attributes })
    }

  return {
    __esModule: true,
    default: {
      createHistogram: (name: string) => ({ record: capture(name) }),
      createCounter: (name: string) => ({ add: capture(name) }),
      createUpDownCounter: (name: string) => ({ add: capture(name) }),
    },
  }
})

// The sensitive values that must never reach a label.
const TOKEN = "cal-token-8f2c4b1a9d"
const CALENDAR_ID = "0b3f1c8e-2d47-4a91-8c55-6e1a7b9d4f30"
const CALENDAR_NAME = "Licence 3 Informatique"
const LOG_ID = "3f1d9a20-1f1e-4a5b-9c7d-8e2b6a4c1d05"
const ASOF_TEXT = "2026-08-29 18:22:06.641234"
const CREATED_AT_TEXT = "2026-08-29 18:20:25.142981"

const pageRow = () => ({
  log: {
    id: LOG_ID,
    calendar: { id: CALENDAR_ID, token: TOKEN, name: CALENDAR_NAME },
    calendarChange: { oldItems: [], newItems: [], changedItems: [] },
    createdAt: timestampTextToDate(CREATED_AT_TEXT),
    updatedAt: timestampTextToDate(CREATED_AT_TEXT),
  } as unknown as CalendarLog,
  createdAtText: CREATED_AT_TEXT,
})

describe("CalendarLogMetricsService", () => {
  let service: CalendarLogService
  let repository: jest.Mocked<CalendarLogRepository>

  beforeEach(async () => {
    mockMeasurements.length = 0

    const module: TestingModule = await Test.createTestingModule({
      providers: [CalendarLogService, CalendarLogMetricsService],
    })
      .useMocker(createMock)
      .compile()

    service = module.get(CalendarLogService)
    repository = module.get(CalendarLogRepository)
    const mapper: jest.Mocked<CalendarLogMapper> = module.get(CalendarLogMapper)

    repository.getSnapshotTime.mockResolvedValue({
      asOf: timestampTextToDate(ASOF_TEXT),
      asOfText: ASOF_TEXT,
    })
    repository.searchPage.mockResolvedValue([pageRow()])
    repository.countSince.mockResolvedValue(7)
    mapper.toCalendarLogV1.mockReturnValue({} as never)
  })

  const attributeValues = () =>
    mockMeasurements.flatMap((measurement) =>
      Object.values(measurement.attributes ?? {}).map(String),
    )

  it("records a first page with only enumerated labels", async () => {
    await service.searchV1({ tokens: [TOKEN], limit: 50 })

    expect(
      mockMeasurements.map(({ instrument, attributes }) => ({
        instrument,
        attributes,
      })),
    ).toEqual([
      {
        instrument: "calendar_log_search_page_rows",
        attributes: { page: "first" },
      },
      {
        instrument: "calendar_log_search_total",
        attributes: { page: "first", outcome: "ok" },
      },
    ])
  })

  it("records a following page as such", async () => {
    await service.searchV1({
      tokens: [TOKEN],
      limit: 50,
      cursor: encodeCursor({
        asOfText: ASOF_TEXT,
        createdAtText: CREATED_AT_TEXT,
        id: LOG_ID,
      }),
    })

    expect(attributeValues()).toEqual(["following", "following", "ok"])
  })

  it("records the unread-count duration with no labels at all", async () => {
    await service.searchV1({
      tokens: [TOKEN],
      limit: 50,
      unreadSince: "2026-08-01T00:00:00.000Z",
    })

    const duration = mockMeasurements.find(
      (m) => m.instrument === "calendar_log_unread_count_duration",
    )

    expect(duration).toBeDefined()
    expect(duration?.attributes).toBeUndefined()
    expect(duration?.value).toBeGreaterThanOrEqual(0)
  })

  it("records an invalid cursor as an outcome, not as its value", async () => {
    await expect(
      service.searchV1({ tokens: [TOKEN], limit: 50, cursor: "!!!not-valid" }),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(mockMeasurements).toEqual([
      {
        instrument: "calendar_log_search_total",
        value: 1,
        attributes: { page: "following", outcome: "invalid_cursor" },
      },
    ])
  })

  // The privacy negative the Reviewer can point at.
  it("never emits a token, calendar, log id or cursor in any label", async () => {
    const cursor = encodeCursor({
      asOfText: ASOF_TEXT,
      createdAtText: CREATED_AT_TEXT,
      id: LOG_ID,
    })

    await service.searchV1({
      tokens: [TOKEN],
      limit: 50,
      unreadSince: "2026-08-01T00:00:00.000Z",
    })
    await service.searchV1({ tokens: [TOKEN], limit: 50, cursor })
    await expect(
      service.searchV1({ tokens: [TOKEN], limit: 50, cursor: "!!!not-valid" }),
    ).rejects.toBeInstanceOf(BadRequestException)

    const serialized = JSON.stringify(mockMeasurements)
    for (const secret of [
      TOKEN,
      CALENDAR_ID,
      CALENDAR_NAME,
      LOG_ID,
      cursor,
      ASOF_TEXT,
      CREATED_AT_TEXT,
    ]) {
      expect(serialized).not.toContain(secret)
    }

    // Every label value is drawn from the two declared unions.
    expect(new Set(attributeValues())).toEqual(
      new Set(["first", "following", "ok", "invalid_cursor"]),
    )
    // And every label *key* is one of the two declared keys.
    expect(
      new Set(mockMeasurements.flatMap((m) => Object.keys(m.attributes ?? {}))),
    ).toEqual(new Set(["page", "outcome"]))
  })
})
