import { CalendarChange } from "modules/calendar-log/models/calendar-change"
import { EventForChangeDetection } from "modules/calendar-log/models/change-detection/find-event-changes"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { EventType } from "modules/fetch/models/event.model"
import { School } from "modules/school/models/school.entity"
import { DataSource, In } from "typeorm"
import { saveE2eCalendar } from "./save-e2e-calendar"

export const E2E_ACTIVITY_BASELINE_TOKEN = "e2e-activity-baseline"
export const E2E_ACTIVITY_CALENDAR_TOKEN = "e2e-activity-calendar"
const E2E_ACTIVITY_BASELINE_ID = "e2e0e2e0-0000-4000-8000-000000000003"
export const E2E_ACTIVITY_CALENDAR_ID = "e2e0e2e0-0000-4000-8000-000000000004"

export const E2E_ACTIVITY_BASELINE_LOG_ID =
  "40000000-0000-4000-8000-000000000001"
export const E2E_ACTIVITY_TIE_LOWER_ID = "40000000-0000-4000-8000-000000000050"
export const E2E_ACTIVITY_TIE_HIGHER_ID = "40000000-0000-4000-8000-000000000051"
export const E2E_ACTIVITY_OLDER_ANCHOR_ID =
  "40000000-0000-4000-8000-000000000052"

const E2E_ACTIVITY_NEW_UID = "e2e-activity-new"
const E2E_ACTIVITY_CHANGED_UID = "e2e-activity-changed-current"
const E2E_ACTIVITY_CANCELLED_UID = "e2e-activity-cancelled"
const E2E_ACTIVITY_TIE_HIGHER_UID = "e2e-activity-tie-higher"
const E2E_ACTIVITY_TIE_LOWER_UID = "e2e-activity-tie-lower"
const E2E_ACTIVITY_OLDER_ANCHOR_UID = "e2e-activity-older-anchor"
const E2E_ACTIVITY_EXPORTED_AT = new Date("2020-01-01T00:00:00.000Z")

const atUtcDay = (daysAgo: number, minute: number): Date => {
  const value = new Date()
  value.setUTCHours(0, 0, 0, 0)
  value.setUTCDate(value.getUTCDate() - daysAgo)
  value.setUTCMinutes(minute)
  return value
}

const changeEvent = (
  uid: string,
  title: string,
  location: string,
  startsAt = atUtcDay(1, 10 * 60),
): EventForChangeDetection => ({
  uid,
  title,
  location,
  startsAt,
  endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
})

const calendarEvent = (
  uid: string,
  title: string,
  location: string,
): CalendarEvent => ({
  ...changeEvent(uid, title, location),
  allDay: false,
  description: `Current details for ${title}`,
  teachers: ["E2E Activity Teacher"],
  tags: [],
  type: EventType.CM,
  fields: null,
  exportedAt: E2E_ACTIVITY_EXPORTED_AT,
})

const oneNew = (event: EventForChangeDetection): CalendarChange => ({
  oldItems: [],
  newItems: [event],
  changedItems: [],
})

interface SeedLog {
  id: string
  calendarChange: CalendarChange
  createdAt: Date
}

/**
 * The Activity-only real-server fixture. The first 49 rows have distinct
 * timestamps. Rows 50/51 deliberately share one timestamp and are ordered by
 * UUID DESC, placing one on each side of the mobile client's 50-row boundary.
 */
export async function seedE2eActivity(
  dataSource: DataSource,
  resolvedSchool?: School | null,
): Promise<void> {
  const logRepository = dataSource.getRepository(CalendarLog)
  const school =
    resolvedSchool === undefined
      ? await dataSource
          .getRepository(School)
          .findOneBy({ code: "mygamingacademia" })
      : resolvedSchool

  const currentNew = calendarEvent(
    E2E_ACTIVITY_NEW_UID,
    "E2E Activity New Lecture",
    "Room Activity New",
  )
  const currentChanged = calendarEvent(
    E2E_ACTIVITY_CHANGED_UID,
    "E2E Activity Changed Current",
    "Room Activity Changed Current",
  )
  const [baseline, activity] = await Promise.all([
    saveE2eCalendar(dataSource, {
      fields: {
        id: E2E_ACTIVITY_BASELINE_ID,
        token: E2E_ACTIVITY_BASELINE_TOKEN,
        name: "E2E Activity Baseline",
        url: "https://e2e.timecalendar.test/activity-baseline.ics",
      },
      events: [],
      now: new Date(),
      school,
    }),
    saveE2eCalendar(dataSource, {
      fields: {
        id: E2E_ACTIVITY_CALENDAR_ID,
        token: E2E_ACTIVITY_CALENDAR_TOKEN,
        name: "E2E Activity Timeline",
        url: "https://e2e.timecalendar.test/activity.ics",
      },
      events: [currentNew, currentChanged],
      now: new Date(),
      school,
    }),
  ])

  await logRepository.delete({
    calendar: { id: In([baseline.id, activity.id]) },
  })

  const changedPrevious = changeEvent(
    "e2e-activity-changed-previous",
    "E2E Activity Changed Previous",
    "Room Activity Changed Previous",
  )
  const cancelled = changeEvent(
    E2E_ACTIVITY_CANCELLED_UID,
    "E2E Activity Cancelled Seminar",
    "Room Activity Cancelled Details",
  )
  const logs: SeedLog[] = [
    {
      id: "40000000-0000-4000-8000-000000000101",
      calendarChange: oneNew(currentNew),
      createdAt: atUtcDay(1, 180),
    },
    {
      id: "40000000-0000-4000-8000-000000000102",
      calendarChange: {
        oldItems: [],
        newItems: [],
        changedItems: [[changedPrevious, currentChanged]],
      },
      createdAt: atUtcDay(1, 179),
    },
    {
      id: "40000000-0000-4000-8000-000000000103",
      calendarChange: { oldItems: [cancelled], newItems: [], changedItems: [] },
      createdAt: atUtcDay(1, 178),
    },
    ...Array.from({ length: 46 }, (_, index): SeedLog => {
      const position = index + 4
      const suffix = String(position).padStart(3, "0")
      return {
        id: `40000000-0000-4000-8000-000000000${suffix}`,
        calendarChange: oneNew(
          changeEvent(
            `e2e-activity-filler-${suffix}`,
            `E2E Activity Filler ${suffix}`,
            `Room Activity Filler ${suffix}`,
          ),
        ),
        createdAt: atUtcDay(1, 178 - position),
      }
    }),
    {
      id: E2E_ACTIVITY_TIE_HIGHER_ID,
      calendarChange: oneNew(
        changeEvent(
          E2E_ACTIVITY_TIE_HIGHER_UID,
          "E2E Activity Tie Higher",
          "Room Activity Tie Higher",
        ),
      ),
      createdAt: atUtcDay(1, 100),
    },
    {
      id: E2E_ACTIVITY_TIE_LOWER_ID,
      calendarChange: oneNew(
        changeEvent(
          E2E_ACTIVITY_TIE_LOWER_UID,
          "E2E Activity Tie Lower",
          "Room Activity Tie Lower",
        ),
      ),
      createdAt: atUtcDay(1, 100),
    },
    {
      id: E2E_ACTIVITY_OLDER_ANCHOR_ID,
      calendarChange: oneNew(
        changeEvent(
          E2E_ACTIVITY_OLDER_ANCHOR_UID,
          "E2E Activity Older Page",
          "Room Activity Older Page",
        ),
      ),
      createdAt: atUtcDay(1, 99),
    },
  ]

  const baselineCreatedAt = atUtcDay(2, 60)
  await logRepository.save([
    ...logs.map((log) => ({
      ...log,
      updatedAt: log.createdAt,
      calendar: { id: activity.id },
    })),
    {
      id: E2E_ACTIVITY_BASELINE_LOG_ID,
      calendar: { id: baseline.id },
      calendarChange: oneNew(
        changeEvent(
          "e2e-activity-baseline-item",
          "E2E Activity Baseline Read",
          "Room Activity Baseline",
        ),
      ),
      createdAt: baselineCreatedAt,
      updatedAt: baselineCreatedAt,
    },
  ])
}
