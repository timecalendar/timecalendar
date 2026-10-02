import assert from "node:assert/strict"
import { test } from "node:test"
import {
  boundsCenter,
  calendarPageDateKeys,
  convertedPageIndex,
  menuItemPoint,
  observeCalendarUi,
  observedPageFromUi,
  selectedCalendarView,
  targetPageFromUi,
} from "./lib/calendar-ui.mjs"

const labels = {
  en: { day: "Day", week: "Week" },
  fr: { day: "Jour", week: "Semaine" },
}
const screen = { width: 1080, height: 2280 }
const node = (id, label, bounds = "[0,0][100,60]") =>
  `<node resource-id="${id}" content-desc="${label}" bounds="${bounds}"/>`
const dates = (keys) =>
  keys.map((key) => node(`owned-calendar-date-${key}`, key)).join("")

test("visible Calendar control and date cells witness a settled page", () => {
  const week = `<hierarchy>${node("example.perf:id/calendar-view", "Week")}${dates(
    calendarPageDateKeys("week", 2962),
  )}</hierarchy>`
  assert.deepEqual(selectedCalendarView(week, labels, screen), {
    mode: "week",
    locale: "en",
    bounds: "[0,0][100,60]",
  })
  assert.equal(observeCalendarUi(week, "week", 2962, labels, screen).matched, true)
  assert.equal(observedPageFromUi(week, "week", labels, screen).page, 2962)
  const weekdays = `<hierarchy>${node("calendar-view", "Week")}${dates(
    calendarPageDateKeys("week", 2962).slice(0, 5),
  )}</hierarchy>`
  assert.equal(observeCalendarUi(weekdays, "week", 2962, labels, screen).matched, true)
  assert.equal(observedPageFromUi(weekdays, "week", labels, screen).page, 2962)
  const sundayStart = calendarPageDateKeys("week", 2962, 0)
  const weekdayOnlySundayStart = sundayStart.filter((key) => {
    const weekday = new Date(`${key}T00:00:00Z`).getUTCDay()
    return weekday !== 0 && weekday !== 6
  })
  assert.deepEqual(weekdayOnlySundayStart, [
    "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16",
  ])
  assert.equal(
    observeCalendarUi(
      `<hierarchy>${node("calendar-view", "Week")}${dates(
        calendarPageDateKeys("week", 2962).slice(0, 4),
      )}</hierarchy>`,
      "week",
      2962,
      labels,
      screen,
    ).matched,
    false,
  )
  assert.equal(observeCalendarUi(week, "week", 2963, labels, screen).matched, false)
  assert.equal(observeCalendarUi(week, "day", 20738, labels, screen).matched, false)
  const missingDate = week.replace('resource-id="owned-calendar-date-2026-10-18"',
    'resource-id="missing-date"')
  assert.equal(observeCalendarUi(missingDate, "week", 2962, labels, screen).matched, false)
  const day = `<hierarchy>${node("calendar-view", "Jour")}${dates(
    calendarPageDateKeys("day", 20738),
  )}</hierarchy>`
  assert.equal(observeCalendarUi(day, "day", 20738, labels, screen).matched, true)
  assert.equal(observedPageFromUi(day, "day", labels, screen).page, 20738)
  assert.equal(observedPageFromUi(day, "week", labels, screen), null)
  assert.equal(observedPageFromUi("<hierarchy/>", "day", labels, screen), null)
  assert.equal(selectedCalendarView(day, labels, screen).locale, "fr")
  assert.equal(calendarPageDateKeys("week", Number.MAX_SAFE_INTEGER), null)
  assert.equal(calendarPageDateKeys("day", Number.MIN_SAFE_INTEGER), null)
  assert.equal(calendarPageDateKeys("week", 2962, 7), null)
})

test("menu automation rejects ambiguous or off-screen targets", () => {
  const menu = `<hierarchy>${node("calendar-view", "Week")}${node("", "Day", "[20,80][180,140]")}</hierarchy>`
  assert.deepEqual(menuItemPoint(menu, "Day", screen), { x: 100, y: 110 })
  assert.equal(menuItemPoint(menu + node("", "Day"), "Day", screen), null)
  assert.equal(menuItemPoint(menu, "Jour", screen), null)
  assert.equal(boundsCenter("[20,80][2000,140]", screen), null)
  assert.equal(boundsCenter("bad", screen), null)
  assert.equal(selectedCalendarView("<hierarchy/>", labels, screen), null)
})

test("mode conversion requires the observed source and target date anchors", () => {
  const source = `<hierarchy>${node("calendar-view", "Week")}${dates(
    calendarPageDateKeys("week", 2962),
  )}</hierarchy>`
  const expectedDay = convertedPageIndex("week", 2962, "day")
  assert.equal(expectedDay, 20738)
  assert.equal(observeCalendarUi(source, "week", 2962, labels, screen).matched, true)
  const wrongDay = `<hierarchy>${node("calendar-view", "Day")}${dates(
    calendarPageDateKeys("day", expectedDay + 1),
  )}</hierarchy>`
  assert.equal(observedPageFromUi(wrongDay, "day", labels, screen).page, expectedDay + 1)
  assert.equal(targetPageFromUi(wrongDay, "week", 2962, "day", labels, screen), null)
  const rightDay = `<hierarchy>${node("calendar-view", "Day")}${dates(
    calendarPageDateKeys("day", expectedDay),
  )}</hierarchy>`
  assert.equal(
    targetPageFromUi(rightDay, "week", 2962, "day", labels, screen).page,
    expectedDay,
  )
  const expectedWeek = convertedPageIndex("day", expectedDay, "week")
  assert.equal(expectedWeek, 2962)
  assert.equal(convertedPageIndex("day", expectedDay + 7, "week"), 2963)
  assert.equal(convertedPageIndex("week", 2962, "day", 0), 20737)
  assert.equal(convertedPageIndex("week", Number.MAX_SAFE_INTEGER, "day"), null)
  assert.equal(convertedPageIndex("agenda", 2962, "day"), null)
})

test("zero-sized, off-screen, or hidden date headers cannot witness a page", () => {
  const key = calendarPageDateKeys("day", 20738)[0]
  const dated = (bounds, hidden = false) =>
    `<hierarchy>${node("calendar-view", "Day")}${node(
      `owned-calendar-date-${key}`,
      key,
      bounds,
    ).replace("<node ", `<node ${hidden ? 'visible-to-user="false" ' : ""}`)}</hierarchy>`
  for (const xml of [
    dated("[0,0][0,60]"),
    dated("[0,0][2000,60]"),
    dated("[0,0][100,60]", true),
  ]) {
    assert.equal(observeCalendarUi(xml, "day", 20738, labels, screen).matched, false)
    assert.equal(observedPageFromUi(xml, "day", labels, screen), null)
  }
  assert.equal(
    selectedCalendarView(node("calendar-view", "Day", "[0,0][0,0]"), labels, screen),
    null,
  )
})
