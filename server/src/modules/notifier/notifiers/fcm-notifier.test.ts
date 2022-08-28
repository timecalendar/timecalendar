import { CalendarChange } from "modules/calendar-log/models/difference"
import { EventType } from "modules/fetch/models/event.model"
import { FirebaseService } from "modules/firebase/services/firebase.service"
import { FcmNotifier } from "modules/notifier/notifiers/fcm-notifier"
import { DifferenceType } from "modules/notifier/notifiers/fcm-notifier-calendar-changed"

describe("FcmNotifier", () => {
  const notify = jest.fn()

  const firebaseService = {
    notify,
  } as unknown as FirebaseService

  const fcmNotifier = new FcmNotifier(firebaseService, {
    type: "fcm",
    token: "123",
  })

  beforeEach(() => {
    notify.mockReset()
  })

  describe("onCalendarChanged", () => {
    it("should handle a new event", async () => {
      const difference: CalendarChange = {
        changedItems: [],
        newItems: [
          {
            uid: "event1",
            title: "Cours",
            allDay: false,
            startsAt: new Date("2021-08-30T07:00:00.000Z"),
            endsAt: new Date("2021-08-30T08:00:00.000Z"),
            description: "",
            location: "",
            type: EventType.CLASS,
            teachers: [],
            tags: [],
            fields: {},
            exportedAt: new Date("2021-09-30T08:00:00.000Z"),
          },
        ],
        oldItems: [],
      }

      await fcmNotifier.onCalendarChanged({ difference })

      expect(notify).toBeCalledTimes(1)
      expect(notify).toBeCalledWith("123", {
        notification: {
          title: "Nouveau cours",
          body: "Cours, 30/08/2021 de 07:00 à 08:00",
        },
        data: {
          action: "calendar_changed",
          payload: JSON.stringify({
            type: DifferenceType.NEW,
            event: difference.newItems[0],
          }),
        },
      })
    })

    it("should handle a modified event", async () => {
      const difference: CalendarChange = {
        changedItems: [
          [
            {
              uid: "event1",
              title: "Cours",
              allDay: false,
              startsAt: new Date("2021-08-30T07:00:00.000Z"),
              endsAt: new Date("2021-08-30T08:00:00.000Z"),
              description: "",
              location: "",
              type: EventType.CLASS,
              teachers: [],
              tags: [],
              fields: {},
              exportedAt: new Date("2021-09-30T08:00:00.000Z"),
            },
            {
              uid: "event1",
              title: "Cours",
              allDay: false,
              startsAt: new Date("2021-08-30T08:00:00.000Z"),
              endsAt: new Date("2021-08-30T09:00:00.000Z"),
              description: "",
              location: "",
              type: EventType.CLASS,
              teachers: [],
              tags: [],
              fields: {},
              exportedAt: new Date("2021-09-30T08:00:00.000Z"),
            },
          ],
        ],
        newItems: [],
        oldItems: [],
      }

      await fcmNotifier.onCalendarChanged({ difference })

      expect(notify).toBeCalledTimes(1)
      expect(notify).toBeCalledWith("123", {
        notification: {
          title: "Cours modifié",
          body: "Cours, 30/08/2021 de 08:00 à 09:00",
        },
        data: {
          action: "calendar_changed",
          payload: JSON.stringify({
            type: DifferenceType.EDIT,
            event: difference.changedItems[0][1],
          }),
        },
      })
    })

    it("should handle a canceled event", async () => {
      const difference: CalendarChange = {
        changedItems: [],
        newItems: [],
        oldItems: [
          {
            uid: "event1",
            title: "Cours",
            allDay: false,
            startsAt: new Date("2021-08-30T07:00:00.000Z"),
            endsAt: new Date("2021-08-30T08:00:00.000Z"),
            description: "",
            location: "",
            type: EventType.CLASS,
            teachers: [],
            tags: [],
            fields: {},
            exportedAt: new Date("2021-09-30T08:00:00.000Z"),
          },
        ],
      }

      await fcmNotifier.onCalendarChanged({ difference })

      expect(notify).toBeCalledTimes(1)
      expect(notify).toBeCalledWith("123", {
        notification: {
          title: "Cours annulé",
          body: "Cours, 30/08/2021 de 07:00 à 08:00",
        },
        data: {
          action: "calendar_changed",
          payload: JSON.stringify({
            type: DifferenceType.CANCEL,
            event: difference.oldItems[0],
          }),
        },
      })
    })
  })
})
