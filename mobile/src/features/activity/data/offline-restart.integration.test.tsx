import { render, screen, waitFor } from "@testing-library/react-native"
import * as React from "react"

import { createFakeDb } from "@/test-support/fake-db"

const mockReact = React

const mockFake = createFakeDb({
  tables: {
    activityLogs: {
      columns: [
        "id",
        "calendarId",
        "calendarName",
        "changeJson",
        "createdAt",
        "updatedAt",
      ],
    },
    activityState: { columns: ["id"] },
  },
})

jest.mock("@/db", () => ({
  ...mockFake.module,
  ...jest.requireActual<object>("@/db/mappers"),
  useLiveQuery: (query: { all: () => unknown[] }) => ({
    data: query.all(),
    updatedAt: new Date(),
  }),
}))
jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))
jest.mock("@/features/calendar-sources/data", () => ({
  findAll: jest
    .fn()
    .mockResolvedValue([
      { id: "cal-offline", token: "token-offline", visible: true },
    ]),
}))
jest.mock("@/api/mutator", () => ({
  ...jest.requireActual<object>("@/api/mutator"),
  customFetch: jest.fn().mockRejectedValue(new Error("offline")),
}))
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: { Screen: () => null },
}))

beforeEach(() => {
  mockFake.reset()
})

it("renders cached Activity after a restart when the real refresh is offline", async () => {
  /* eslint-disable-next-line @typescript-eslint/no-require-imports */
  const repository = require("./repository") as typeof import("./repository")
  await repository.storeNewestPage({
    rows: [
      {
        id: "cached-log",
        calendarId: "cal-offline",
        calendarName: "Offline calendar",
        changeJson: JSON.stringify({
          oldItems: [],
          newItems: [
            {
              uid: "cached-event",
              title: "Cached Activity survives restart",
              startsAt: "2026-08-29T10:00:00.000Z",
              endsAt: "2026-08-29T11:00:00.000Z",
              location: "Offline room",
            },
          ],
          changedItems: [],
        }),
        createdAt: "2026-08-29T12:00:00.000Z",
        updatedAt: "2026-08-29T12:00:00.000Z",
      },
    ],
    asOf: "2026-08-29T12:00:00.000Z",
    heldCalendarIds: ["cal-offline"],
    nextCursor: null,
  })

  // Keep one React singleton across the simulated process restart while
  // dropping and reloading the Activity modules themselves.
  jest.doMock("react", () => mockReact)
  jest.resetModules()

  /* eslint-disable @typescript-eslint/no-require-imports */
  const { customFetch } =
    require("@/api/mutator") as typeof import("@/api/mutator")
  const { ActivityScreen } =
    require("../ui/activity-screen") as typeof import("../ui/activity-screen")
  /* eslint-enable @typescript-eslint/no-require-imports */

  await render(<ActivityScreen />)

  await waitFor(() => {
    expect(screen.getByText("Cached Activity survives restart")).toBeTruthy()
    expect(screen.getByTestId("activity-cached-error")).toBeTruthy()
  })
  expect(customFetch).toHaveBeenCalledTimes(1)
})
