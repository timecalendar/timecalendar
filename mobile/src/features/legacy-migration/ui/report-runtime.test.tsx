import { act, render } from "@testing-library/react-native"
import { AppState, type AppStateStatus } from "react-native"

import { MigrationReportRuntime } from "./report-runtime"

const mockDeliver = jest.fn(async () => undefined)
jest.mock("@/features/legacy-migration/data/runtime", () => ({
  deliverMigrationReports: () => mockDeliver(),
}))

it("retries after connected foreground/timer opportunities and tears down independently", async () => {
  jest.useFakeTimers()
  let listener: (state: AppStateStatus) => void = () => {}
  const remove = jest.fn()
  const subscription = jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event, callback) => {
      listener = callback
      return { remove }
    })
  mockDeliver.mockClear()
  const view = await render(<MigrationReportRuntime />)
  expect(mockDeliver).toHaveBeenCalledTimes(1)
  await act(async () => {
    listener("background")
    listener("active")
    jest.advanceTimersByTime(60_000)
  })
  expect(mockDeliver).toHaveBeenCalledTimes(3)
  mockDeliver.mockRejectedValueOnce(new Error("offline"))
  await act(async () => {
    listener("active")
  })
  await view.unmount()
  expect(remove).toHaveBeenCalledTimes(1)
  const attempts = mockDeliver.mock.calls.length
  await act(async () => {
    jest.advanceTimersByTime(120_000)
  })
  expect(mockDeliver).toHaveBeenCalledTimes(attempts)
  subscription.mockRestore()
  jest.useRealTimers()
})
