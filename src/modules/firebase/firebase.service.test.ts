import { FirebaseService } from "./firebase.service"
import { NotifyOptions } from "./models/notify-options.model"

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

    const module = require("./firebase.service")
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

  it("should handle the error when the token does not exist", async () => {
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

    const token = "123"
    const options: NotifyOptions = {
      notification: {
        title: "Test notification",
        body: "Hello world",
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require("./firebase.service")
    const mockedService: FirebaseService = new module.FirebaseService()
    await mockedService.notify(token, options)
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

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require("./firebase.service")
    const mockedService: FirebaseService = new module.FirebaseService()

    await expect(async () => {
      await mockedService.notify(token, options)
    }).rejects.toThrow()
  })
})
