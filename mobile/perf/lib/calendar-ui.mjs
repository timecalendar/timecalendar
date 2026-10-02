const decodeXml = (value) =>
  value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")

export const parseUiNodes = (xml) =>
  [...xml.matchAll(/<node\b([^>]*?)\/?\s*>/g)].map(([, text]) =>
    Object.fromEntries(
      [...text.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [
        key,
        decodeXml(value),
      ]),
    ),
  )

const resourceName = (node) => (node["resource-id"] ?? "").split("/").at(-1)

export const boundsCenter = (bounds, screen) => {
  const match = bounds?.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/)
  if (!match) return null
  const [, left, top, right, bottom] = match.map(Number)
  if (
    right <= left ||
    bottom <= top ||
    left < 0 ||
    top < 0 ||
    right > screen.width ||
    bottom > screen.height
  )
    return null
  return { x: Math.floor((left + right) / 2), y: Math.floor((top + bottom) / 2) }
}

export const selectedCalendarView = (xml, labelsByLocale, screen) => {
  const controls = parseUiNodes(xml).filter(
    (node) =>
      resourceName(node) === "calendar-view" &&
      node["visible-to-user"] !== "false" &&
      boundsCenter(node.bounds, screen) !== null,
  )
  if (controls.length !== 1) return null
  const label = controls[0]["content-desc"] || controls[0].text
  const matches = Object.entries(labelsByLocale).flatMap(([locale, labels]) =>
    ["day", "week"].filter((mode) => labels[mode] === label).map((mode) => ({
      mode,
      locale,
      bounds: controls[0].bounds,
    })),
  )
  return matches.length === 1 ? matches[0] : null
}

const visibleDateKeys = (xml, screen) =>
  parseUiNodes(xml)
    .filter(
      (node) =>
        node["visible-to-user"] !== "false" &&
        boundsCenter(node.bounds, screen) !== null,
    )
    .map(resourceName)
    .filter((name) => /^owned-calendar-date-\d{4}-\d{2}-\d{2}$/.test(name))
    .map((name) => name.slice("owned-calendar-date-".length))
    .sort()

const epochDayOfKey = (key) => {
  const date = new Date(`${key}T00:00:00Z`)
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === key
    ? date.getTime() / 86400000
    : null
}

export const calendarPageDateKeys = (mode, index, firstWeekday = 1) => {
  if (
    !Number.isSafeInteger(index) ||
    !Number.isInteger(firstWeekday) ||
    firstWeekday < 0 ||
    firstWeekday > 6 ||
    !["day", "week"].includes(mode)
  )
    return null
  const start =
    mode === "day"
      ? index
      : index * 7 + ((firstWeekday + 3) % 7)
  const days = Array.from(
    { length: mode === "day" ? 1 : 7 },
    (_, offset) => new Date((start + offset) * 86400000),
  )
  if (days.some((day) => !Number.isFinite(day.getTime()))) return null
  return days.map((day) => day.toISOString().slice(0, 10))
}

export const observeCalendarUi = (
  xml,
  expectedMode,
  expectedPage,
  labelsByLocale,
  screen,
  firstWeekday = 1,
) => {
  const selected = selectedCalendarView(xml, labelsByLocale, screen)
  const dateKeys = visibleDateKeys(xml, screen)
  const expectedDateKeys = calendarPageDateKeys(expectedMode, expectedPage, firstWeekday)
  const visibleWeekdays = expectedDateKeys?.filter((key) => {
    const weekday = new Date(`${key}T00:00:00Z`).getUTCDay()
    return weekday !== 0 && weekday !== 6
  })
  const exactDates = (expected) =>
    Array.isArray(expected) &&
    dateKeys.length === expected.length &&
    dateKeys.every((key, index) => key === expected[index])
  const matched =
    selected?.mode === expectedMode &&
    expectedDateKeys !== null &&
    (exactDates(expectedDateKeys) ||
      (expectedMode === "week" && exactDates(visibleWeekdays)))
  return {
    mode: selected?.mode ?? null,
    locale: selected?.locale ?? null,
    dateKeys,
    expectedDateKeys,
    matched,
  }
}

export const observedPageFromUi = (
  xml,
  expectedMode,
  labelsByLocale,
  screen,
  firstWeekday = 1,
) => {
  const selected = selectedCalendarView(xml, labelsByLocale, screen)
  const keys = visibleDateKeys(xml, screen)
  const firstDay = keys.length > 0 ? epochDayOfKey(keys[0]) : null
  if (selected?.mode !== expectedMode || firstDay === null) return null
  const page =
    expectedMode === "day"
      ? firstDay
      : Math.floor((firstDay - ((firstWeekday + 3) % 7)) / 7)
  const witness = observeCalendarUi(
    xml,
    expectedMode,
    page,
    labelsByLocale,
    screen,
    firstWeekday,
  )
  return witness.matched ? { page, ...witness } : null
}

export const convertedPageIndex = (from, page, to, firstWeekday = 1) => {
  if (
    !["day", "week"].includes(from) ||
    !["day", "week"].includes(to) ||
    !Number.isSafeInteger(page) ||
    !Number.isInteger(firstWeekday) ||
    firstWeekday < 0 ||
    firstWeekday > 6
  )
    return null
  const start = from === "day" ? page : page * 7 + ((firstWeekday + 3) % 7)
  if (!Number.isSafeInteger(start)) return null
  const target =
    to === "day"
      ? start
      : Math.floor((start - ((firstWeekday + 3) % 7)) / 7)
  return Number.isSafeInteger(target) ? target : null
}

export const targetPageFromUi = (
  xml,
  from,
  sourcePage,
  to,
  labelsByLocale,
  screen,
  firstWeekday = 1,
) => {
  const expectedPage = convertedPageIndex(from, sourcePage, to, firstWeekday)
  if (expectedPage === null) return null
  const observed = observedPageFromUi(
    xml,
    to,
    labelsByLocale,
    screen,
    firstWeekday,
  )
  return observed?.page === expectedPage ? observed : null
}

export const menuItemPoint = (xml, label, screen) => {
  const nodes = parseUiNodes(xml).filter(
    (node) =>
      resourceName(node) !== "calendar-view" &&
      (node.text === label || node["content-desc"] === label),
  )
  const points = nodes
    .map((node) => boundsCenter(node.bounds, screen))
    .filter(Boolean)
  return points.length === 1 ? points[0] : null
}
