import { NotifyOptions } from "modules/firebase/models/notify-options.model"
import { FirebaseService } from "modules/firebase/services/firebase.service"

/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock("config/firebase.ts", () => ({}))

describe("FirebaseService", () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it("should notify the user with FCM", async () => {
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
        screen: "home",
      },
    }

    const module = require("modules/firebase/services/firebase.service")
    const send = require("config/firebase").messaging().send
    const mockedService: FirebaseService = new module.FirebaseService()
    await mockedService.notify(token, options)

    expect(send).toBeCalledTimes(1)
    expect(send).toBeCalledWith({
      notification: {
        title: "Test notification",
        body: "Hello world",
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        screen: "home",
      },
      android: {
        priority: "high",
      },
      token: "123",
    })
  })

  it("returns null when the token is no longer registered (legacy message match)", async () => {
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
    const mockedService: FirebaseService = new module.FirebaseService()
    const result = await mockedService.notify(token, options)

    expect(result).toBeNull()
  })

  it("returns null when the FCM error code is registration-token-not-registered", async () => {
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
    const mockedService: FirebaseService = new module.FirebaseService()
    const result = await mockedService.notify(token, options)

    expect(result).toBeNull()
  })

  it("should throw an error when FCM returns an unknown error", async () => {
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
    const mockedService: FirebaseService = new module.FirebaseService()

    await expect(async () => {
      await mockedService.notify(token, options)
    }).rejects.toThrow()
  })
})
