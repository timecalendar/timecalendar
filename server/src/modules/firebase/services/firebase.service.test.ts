import { FirebaseMetricsService } from "modules/firebase/services/firebase-metrics.service"
import { NotifyOptions } from "modules/firebase/models/notify-options.model"
import { FirebaseService } from "modules/firebase/services/firebase.service"

/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock("config/firebase.ts", () => ({}))

function buildMetrics() {
  const add = jest.fn()
  const metrics = {
    pushNotificationsCounter: { add },
  } as unknown as FirebaseMetricsService
  return { metrics, add }
}

describe("FirebaseService", () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it("should notify the user with FCM and count a success", async () => {
    jest.doMock("config/firebase.ts", () => {
      const send = jest.fn(() => Promise.resolve())

      return {
        messaging: jest.fn(() => ({
          send,
        })),
      }
    })

    const token = "123"
    const options: NotifyOptions = {
      notification: {
        title: "Test notification",
        body: "Hello world",
      },
      data: {
        action: "calendar_changed",
        screen: "home",
      },
    }

    const module = require("modules/firebase/services/firebase.service")
    const send = require("config/firebase").messaging().send
    const { metrics, add } = buildMetrics()
    const mockedService: FirebaseService = new module.FirebaseService(metrics)
    await mockedService.notify(token, options)

    expect(send).toBeCalledTimes(1)
    expect(send).toBeCalledWith({
      notification: {
        title: "Test notification",
        body: "Hello world",
      },
      data: {
        action: "calendar_changed",
        screen: "home",
      },
      android: {
        priority: "high",
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {},
        },
      },
      token: "123",
    })
    expect(add).toBeCalledWith(1, {
      result: "success",
      type: "calendar_changed",
    })
  })

  it("maps collapseId, collapseKey and threadId onto the android/apns blocks", async () => {
    jest.doMock("config/firebase.ts", () => {
      const send = jest.fn(() => Promise.resolve())

      return {
        messaging: jest.fn(() => ({
          send,
        })),
      }
    })

    const module = require("modules/firebase/services/firebase.service")
    const send = require("config/firebase").messaging().send
    const { metrics } = buildMetrics()
    const mockedService: FirebaseService = new module.FirebaseService(metrics)

    await mockedService.notify("123", {
      notification: { title: "t", body: "b" },
      data: { action: "calendar_digest", count: "2" },
      collapseId: "schedule-digest",
      collapseKey: "schedule-digest",
      threadId: "schedule",
    })

    expect(send).toBeCalledWith({
      notification: { title: "t", body: "b" },
      data: { action: "calendar_digest", count: "2" },
      android: {
        priority: "high",
        collapseKey: "schedule-digest",
        notification: { tag: "schedule-digest" },
      },
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-collapse-id": "schedule-digest",
        },
        payload: {
          aps: { threadId: "schedule" },
        },
      },
      token: "123",
    })
  })

  it("returns null and counts invalid_token when the token is no longer registered (legacy message match)", async () => {
    jest.doMock("config/firebase.ts", () => {
      const send = jest.fn(() =>
        Promise.reject(new Error("Requested entity was not found.")),
      )

      return {
        messaging: jest.fn(() => ({
          send,
        })),
      }
    })

    const token = "abcdef1234567890"
    const options: NotifyOptions = {
      notification: {
        title: "Test notification",
        body: "Hello world",
      },
    }

    const module = require("modules/firebase/services/firebase.service")
    const { metrics, add } = buildMetrics()
    const mockedService: FirebaseService = new module.FirebaseService(metrics)
    const result = await mockedService.notify(token, options)

    expect(result).toBeNull()
    expect(add).toBeCalledWith(1, { result: "invalid_token", type: "unknown" })
  })

  it("returns null and counts invalid_token when the FCM error code is registration-token-not-registered", async () => {
    jest.doMock("config/firebase.ts", () => {
      const error = new Error("token not registered") as Error & {
        code: string
      }
      error.code = "messaging/registration-token-not-registered"
      const send = jest.fn(() => Promise.reject(error))

      return {
        messaging: jest.fn(() => ({
          send,
        })),
      }
    })

    const token = "short"
    const options: NotifyOptions = {
      notification: { title: "x", body: "y" },
    }

    const module = require("modules/firebase/services/firebase.service")
    const { metrics, add } = buildMetrics()
    const mockedService: FirebaseService = new module.FirebaseService(metrics)
    const result = await mockedService.notify(token, options)

    expect(result).toBeNull()
    expect(add).toBeCalledWith(1, { result: "invalid_token", type: "unknown" })
  })

  it("throws and counts a failure when FCM returns an unknown error", async () => {
    jest.doMock("config/firebase.ts", () => {
      const send = jest.fn(() => Promise.reject(new Error()))

      return {
        messaging: jest.fn(() => ({
          send,
        })),
      }
    })

    const token = "123"
    const options: NotifyOptions = {
      notification: {
        title: "Test notification",
        body: "Hello world",
      },
    }

    const module = require("modules/firebase/services/firebase.service")
    const { metrics, add } = buildMetrics()
    const mockedService: FirebaseService = new module.FirebaseService(metrics)

    await expect(async () => {
      await mockedService.notify(token, options)
    }).rejects.toThrow()
    expect(add).toBeCalledWith(1, { result: "failure", type: "unknown" })
  })
})
