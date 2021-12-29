import { Difference } from "src/modules/difference/models/difference"
import { EventType } from "src/modules/fetch/models/event"
import { FirebaseService } from "src/modules/firebase/firebase.service"
import { FcmNotifier } from "./fcm-notifier"
import { DifferenceType } from "./fcm-notifier-calendar-changed"

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
      const difference: Difference = {
        changedItems: [],
        newItems: [
          {
            uid: "event1",
            title: "Cours",
            allDay: false,
            startsAt: new Date("2021-08-30T07:00:00.000Z"),
            endsAt: new Date("2021-08-30T08:00:00.000Z"),
            start: 1630306800000,
            end: 1630310400000,
            description: "",
            location: "",
            type: EventType.CLASS,
            teachers: [],
            tags: [],
            fields: {},
            exportedAt: 1630310400000,
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
      const difference: Difference = {
        changedItems: [
          [
            {
              uid: "event1",
              title: "Cours",
              allDay: false,
              startsAt: new Date("2021-08-30T07:00:00.000Z"),
              endsAt: new Date("2021-08-30T08:00:00.000Z"),
              start: 1630306800000,
              end: 1630310400000,
              description: "",
              location: "",
              type: EventType.CLASS,
              teachers: [],
              tags: [],
              fields: {},
              exportedAt: 1630310400000,
            },
            {
              uid: "event1",
              title: "Cours",
              allDay: false,
              startsAt: new Date("2021-08-30T08:00:00.000Z"),
              endsAt: new Date("2021-08-30T09:00:00.000Z"),
              start: 1630306800000,
              end: 1630310400000,
              description: "",
              location: "",
              type: EventType.CLASS,
              teachers: [],
              tags: [],
              fields: {},
              exportedAt: 1630310400000,
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
      const difference: Difference = {
        changedItems: [],
        newItems: [],
        oldItems: [
          {
            uid: "event1",
            title: "Cours",
            allDay: false,
            startsAt: new Date("2021-08-30T07:00:00.000Z"),
            endsAt: new Date("2021-08-30T08:00:00.000Z"),
            start: 1630306800000,
            end: 1630310400000,
            description: "",
            location: "",
            type: EventType.CLASS,
            teachers: [],
            tags: [],
            fields: {},
            exportedAt: 1630310400000,
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
