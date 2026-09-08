import {
  MAX_FRAGMENT_BYTES,
  projectCalendarLogV1,
  serializedJsonBytes,
} from "modules/calendar-log/models/calendar-log-v1-projection"
import { CalendarLogV1 } from "modules/calendar-log/models/dto/calendar-log-v1.dto"
import { CalendarLogEventGet } from "modules/calendar-log/models/dto/calendar-log-event-get.dto"

const event = (kind: string, index: number): CalendarLogEventGet => ({
  uid: `${kind}-${index}`,
  title: `${kind}-${index}-${"x".repeat(700)}`,
  location: `room-${index}`,
  startsAt: new Date("2026-09-01T08:00:00.000Z"),
  endsAt: new Date("2026-09-01T09:00:00.000Z"),
})

const source = (count: number): CalendarLogV1 => ({
  id: "3f1d9a20-1f1e-4a5b-9c7d-8e2b6a4c1d05",
  calendarId: "0b3f1c8e-2d47-4a91-8c55-6e1a7b9d4f30",
  calendarName: "Fixture calendar",
  calendarChange: {
    newItems: Array.from({ length: count }, (_, index) => event("new", index)),
    changedItems: Array.from({ length: count }, (_, index) => {
      const previousItem = event("changed", index)
      return {
        previousItem,
        newItem: { ...event("changed-after", index), uid: previousItem.uid },
      }
    }),
    oldItems: Array.from({ length: count }, (_, index) => event("old", index)),
  },
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  updatedAt: new Date("2026-09-01T10:00:00.000Z"),
})

describe("CalendarLogV1 projection", () => {
  it("keeps an ordinary item unchanged", () => {
    const item = source(1)
    const projection = projectCalendarLogV1(item)

    expect(projection).toEqual({
      fragments: [{ item, startOffset: 0, endOffset: 3, oversized: false }],
      totalEntries: 3,
      oversizedAtomicEntries: 0,
    })
  })

  it("greedily fragments in presentation order with stable distinct ids", () => {
    const item = source(220)
    const first = projectCalendarLogV1(item)
    const second = projectCalendarLogV1(item)

    expect(
      first.fragments.map(({ startOffset, endOffset }) => [
        startOffset,
        endOffset,
      ]),
    ).toEqual([
      [0, 262],
      [262, 411],
      [411, 660],
    ])
    expect(second).toEqual(first)
    expect(first.fragments[0]?.item.id).toBe(item.id)
    expect(
      new Set(first.fragments.map((fragment) => fragment.item.id)).size,
    ).toBe(first.fragments.length)
    expect(
      first.fragments.every(
        (fragment) => serializedJsonBytes(fragment.item) <= MAX_FRAGMENT_BYTES,
      ),
    ).toBe(true)

    const reconstructedNew = first.fragments.flatMap(
      ({ item: fragment }) => fragment.calendarChange.newItems,
    )
    const reconstructedChanged = first.fragments.flatMap(
      ({ item: fragment }) => fragment.calendarChange.changedItems,
    )
    const reconstructedOld = first.fragments.flatMap(
      ({ item: fragment }) => fragment.calendarChange.oldItems,
    )
    expect(reconstructedNew).toEqual(item.calendarChange.newItems)
    expect(reconstructedChanged).toEqual(item.calendarChange.changedItems)
    expect(reconstructedOld).toEqual(item.calendarChange.oldItems)
    expect(
      first.fragments.every(({ item: fragment }) =>
        fragment.calendarChange.changedItems.every(
          (pair) => pair.previousItem.uid === pair.newItem.uid,
        ),
      ),
    ).toBe(true)
  })

  it("returns one oversized atomic entry alone so pagination can progress", () => {
    const item = source(0)
    item.calendarChange.newItems = [
      { ...event("huge", 0), title: "x".repeat(MAX_FRAGMENT_BYTES + 1) },
      event("following", 1),
    ]

    const projection = projectCalendarLogV1(item)

    expect(projection.fragments[0]?.endOffset).toBe(1)
    expect(projection.fragments[0]?.item.calendarChange.newItems).toHaveLength(
      1,
    )
    expect(projection.fragments[1]?.startOffset).toBe(1)
    expect(projection.oversizedAtomicEntries).toBe(1)
  })
})
