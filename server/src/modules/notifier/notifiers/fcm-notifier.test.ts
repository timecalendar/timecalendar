import { QueueService } from "@lyrolab/nest-shared/queue"
import { EventForChangeDetection } from "modules/calendar-log/models/change-detection/find-event-changes"
import {
  SEND_PUSH_JOB,
  sendPushJobOptions,
} from "modules/notifier/jobs/send-push.constants"
import { CalendarChangeItem } from "modules/notifier/models/notifier"
import { FcmNotifier } from "modules/notifier/notifiers/fcm-notifier"

describe("FcmNotifier", () => {
  const add = jest.fn()
  const queueService = { add } as unknown as QueueService

  const fcmNotifier = new FcmNotifier(queueService, {
    type: "fcm",
    token: "token-123",
  })

  const event: EventForChangeDetection = {
    uid: "event-1",
    title: "Cours",
    location: null,
    startsAt: new Date("2025-01-01T10:00:00.000Z"),
    endsAt: new Date("2025-01-01T11:00:00.000Z"),
  }

  const basePayload = {
    subscriptionId: "sub-1",
    locale: "fr" as const,
    timezone: "Europe/Paris",
  }

  beforeEach(() => {
    add.mockReset()
  })

  it("enqueues one send_push job for a single change", async () => {
    const changes: CalendarChangeItem[] = [{ type: "new", event }]

    await fcmNotifier.onCalendarChanged({ ...basePayload, changes })

    expect(add).toHaveBeenCalledTimes(1)
    expect(add).toHaveBeenCalledWith(
      SEND_PUSH_JOB,
      {
        subscriptionId: "sub-1",
        token: "token-123",
        push: expect.objectContaining({
          notification: expect.objectContaining({ title: "Nouveau cours" }),
          data: expect.objectContaining({ action: "calendar_changed" }),
          collapseId: "event-1",
        }),
      },
      sendPushJobOptions,
    )
  })

  it("enqueues one digest job for multiple changes", async () => {
    const changes: CalendarChangeItem[] = [
      { type: "new", event },
      { type: "cancel", event: { ...event, uid: "event-2" } },
    ]

    await fcmNotifier.onCalendarChanged({ ...basePayload, changes })

    expect(add).toHaveBeenCalledTimes(1)
    expect(add.mock.calls[0][1].push.data.action).toBe("calendar_digest")
    expect(add.mock.calls[0][1].push.data.count).toBe("2")
  })

  it("enqueues nothing when the filtered change set is empty", async () => {
    await fcmNotifier.onCalendarChanged({ ...basePayload, changes: [] })

    expect(add).not.toHaveBeenCalled()
  })
})
