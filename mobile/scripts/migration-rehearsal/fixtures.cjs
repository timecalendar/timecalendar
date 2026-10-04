const tokenFor = (index) =>
  `synthetic-offline-token-${index}-not-a-service-credential`
const calendarIdFor = (index) => `migration-fixture-calendar-${index}`

function calendarFixture(index, revision = 1) {
  if (!Number.isInteger(index) || index < 0 || index > 2)
    throw new Error("Unknown synthetic calendar")
  const base = new Date(2026, 9, 5, 9)
  const event = (uid, title, offset) => ({
    type: "class",
    color: "#3366cc",
    groupColor: "#3366cc",
    uid,
    title,
    startsAt: new Date(base.getTime() + offset * 3_600_000).toISOString(),
    endsAt: new Date(base.getTime() + (offset + 1) * 3_600_000).toISOString(),
    location: "Synthetic campus room",
    allDay: false,
    description: "Synthetic backend fixture",
    teachers: [],
    tags: [],
    fields: null,
    exportedAt: new Date(Date.UTC(2026, 9, 4, 12, revision)).toISOString(),
  })
  const events =
    index === 0
      ? [
          event(
            "synthetic-cached-event",
            `Synthetic linked course revision ${revision}`,
            0,
          ),
          event(
            "synthetic-visible-course",
            `Synthetic visible course revision ${revision}`,
            2,
          ),
          ...Array.from({ length: 21 }, (_, hidden) =>
            event(
              `synthetic-hidden-uid-${hidden}`,
              `Synthetic UID hidden course ${hidden}`,
              4 + hidden * 2,
            ),
          ),
          ...Array.from({ length: 6 }, (_, hidden) =>
            event(
              `synthetic-hidden-name-event-${hidden}`,
              `Synthetic hidden name ${hidden}`,
              47 + hidden * 2,
            ),
          ),
        ]
      : [
          event(
            `synthetic-visible-course-${index}`,
            `Synthetic calendar ${index} course revision ${revision}`,
            index,
          ),
        ]
  return {
    calendar: {
      id: calendarIdFor(index),
      token: tokenFor(index),
      name: `Synthetic calendar ${index}`,
      schoolName: index === 0 ? null : "Synthetic school",
      ...(index === 0 ? {} : { schoolId: "synthetic-school" }),
      lastUpdatedAt: base.toISOString(),
      createdAt: new Date(2026, 8, 4, 9).toISOString(),
    },
    events,
  }
}

function indexForToken(token) {
  const match =
    typeof token === "string" &&
    /^synthetic-offline-token-([0-2])-not-a-service-credential$/.exec(token)
  if (!match) throw new Error("Non-synthetic calendar request refused")
  return Number(match[1])
}

module.exports = { tokenFor, calendarIdFor, calendarFixture, indexForToken }
