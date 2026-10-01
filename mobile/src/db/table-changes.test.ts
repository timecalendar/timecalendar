import { calendarEvents, personalEvents } from "./schema"

const mockAddDatabaseChangeListener = jest.fn()
const mockRemove = jest.fn()

jest.mock("expo-sqlite", () => ({
  addDatabaseChangeListener: (cb: (event: { tableName: string }) => void) =>
    mockAddDatabaseChangeListener(cb),
}))

const { subscribeToTableChanges } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./table-changes") as typeof import("./table-changes")

function fire(tableName: string): void {
  const cb = mockAddDatabaseChangeListener.mock.calls.at(-1)?.[0] as (event: {
    tableName: string
  }) => void
  cb({ tableName })
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  mockAddDatabaseChangeListener.mockReset()
  mockRemove.mockReset()
  mockAddDatabaseChangeListener.mockReturnValue({ remove: mockRemove })
})

describe("subscribeToTableChanges", () => {
  it("collapses a burst on observed tables into one trailing call", async () => {
    const listener = jest.fn()
    subscribeToTableChanges([calendarEvents, personalEvents], listener)
    expect(mockAddDatabaseChangeListener).toHaveBeenCalledTimes(1)

    for (let i = 0; i < 10; i += 1) fire("calendar_events")
    fire("personal_events")
    expect(listener).not.toHaveBeenCalled()
    await tick()
    expect(listener).toHaveBeenCalledTimes(1)

    fire("personal_events")
    await tick()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("ignores other tables", async () => {
    const listener = jest.fn()
    subscribeToTableChanges([calendarEvents], listener)
    fire("activity_logs")
    await tick()
    expect(listener).not.toHaveBeenCalled()
  })

  it("cancels a pending call and removes the native listener on unsubscribe", async () => {
    const listener = jest.fn()
    const unsubscribe = subscribeToTableChanges([calendarEvents], listener)
    fire("calendar_events")
    unsubscribe()
    await tick()
    expect(listener).not.toHaveBeenCalled()
    expect(mockRemove).toHaveBeenCalledTimes(1)
    unsubscribe()
    expect(mockRemove).toHaveBeenCalledTimes(2)
  })
})
