import { EventForChangeDetection } from "modules/calendar-log/models/change-detection/find-event-changes"
import {
  buildCalendarChangedPush,
  buildDetailPush,
  buildDigestPush,
  buildEventBody,
  FCM_CALENDAR_CHANGED_ACTION,
  FCM_CALENDAR_DIGEST_ACTION,
  SCHEDULE_DIGEST_COLLAPSE_ID,
  SCHEDULE_THREAD_ID,
} from "modules/notifier/notifiers/fcm-push-builder"

const event: EventForChangeDetection = {
  uid: "event-1",
  title: "Cours",
  location: "B203",
  startsAt: new Date("2025-01-01T10:00:00.000Z"),
  endsAt: new Date("2025-01-01T11:00:00.000Z"),
}

describe("buildEventBody", () => {
  it("renders in French, Europe/Paris (UTC+1 in winter)", () => {
    expect(buildEventBody(event, "fr", "Europe/Paris")).toBe(
      "Cours, mercredi 1 janvier de 11:00 à 12:00 (B203)",
    )
  })

  it("renders in English, overseas timezone (America/Martinique, UTC-4)", () => {
    expect(buildEventBody(event, "en", "America/Martinique")).toBe(
      "Cours, Wednesday, January 1 from 6:00 AM to 7:00 AM (B203)",
    )
  })

  it("omits missing title and location", () => {
    expect(
      buildEventBody(
        { ...event, title: "", location: null },
        "fr",
        "Europe/Paris",
      ),
    ).toBe("mercredi 1 janvier de 11:00 à 12:00")
  })
})

describe("buildDetailPush", () => {
  it("builds the v2 detail shape with per-event collapse", () => {
    const push = buildDetailPush(
      { type: "cancel", event },
      "fr",
      "Europe/Paris",
    )

    expect(push).toEqual({
      notification: {
        title: "Cours annulé",
        body: "Cours, mercredi 1 janvier de 11:00 à 12:00 (B203)",
      },
      data: {
        action: FCM_CALENDAR_CHANGED_ACTION,
        payload: JSON.stringify({ type: "cancel", event }),
      },
      collapseId: "event-1",
      threadId: SCHEDULE_THREAD_ID,
    })
  })

  it("serializes the payload with a lowercase type", () => {
    const push = buildDetailPush({ type: "new", event }, "en", "Europe/Paris")
    expect(JSON.parse(push.data!.payload).type).toBe("new")
  })
})

describe("buildDigestPush", () => {
  it("builds one replaceable digest", () => {
    const push = buildDigestPush(3, "fr")

    expect(push).toEqual({
      notification: {
        title: "Emploi du temps mis à jour",
        body: "3 changements dans votre emploi du temps",
      },
      data: {
        action: FCM_CALENDAR_DIGEST_ACTION,
        count: "3",
      },
      collapseId: SCHEDULE_DIGEST_COLLAPSE_ID,
      collapseKey: SCHEDULE_DIGEST_COLLAPSE_ID,
      threadId: SCHEDULE_THREAD_ID,
    })
  })

  it("localizes the digest in English", () => {
    const push = buildDigestPush(2, "en")
    expect(push.notification!.body).toBe("2 changes in your schedule")
  })
})

describe("buildCalendarChangedPush tiering", () => {
  const payload = (changes: { type: "new" | "edit" | "cancel" }[]) => ({
    subscriptionId: "sub-1",
    changes: changes.map((c) => ({ ...c, event })),
    locale: "fr" as const,
    timezone: "Europe/Paris",
  })

  it("returns null for zero changes", () => {
    expect(buildCalendarChangedPush(payload([]))).toBeNull()
  })

  it("returns a detail push for exactly one change", () => {
    const push = buildCalendarChangedPush(payload([{ type: "edit" }]))
    expect(push!.data!.action).toBe(FCM_CALENDAR_CHANGED_ACTION)
    expect(push!.notification!.title).toBe("Cours modifié")
  })

  it("returns one digest for two or more changes", () => {
    const push = buildCalendarChangedPush(
      payload([{ type: "edit" }, { type: "new" }, { type: "cancel" }]),
    )
    expect(push!.data!.action).toBe(FCM_CALENDAR_DIGEST_ACTION)
    expect(push!.data!.count).toBe("3")
  })
})
