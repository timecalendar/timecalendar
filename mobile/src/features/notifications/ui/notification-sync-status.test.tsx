import { fireEvent, render } from "@testing-library/react-native"
import { AccessibilityInfo } from "react-native"

import type { NotificationSyncStatus as SyncStatus } from "@/features/notifications/data"
import { usePlatform } from "@/test-support/platform"

import { NotificationSyncStatus } from "./notification-sync-status"

describe("NotificationSyncStatus", () => {
  usePlatform("ios")

  it("announces every shared synchronization state transition", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => undefined)
    const retry = jest.fn()
    const states: readonly [SyncStatus, string][] = [
      [{ state: "pending" }, "Saving notification settings…"],
      [
        { state: "waiting", reason: "registration" },
        "Waiting for notification registration before saving remotely.",
      ],
      [
        { state: "waiting", reason: "calendars" },
        "Waiting for calendars to load before saving remotely.",
      ],
      [
        { state: "error" },
        "Notification settings are saved on this device but not yet remotely.",
      ],
      [{ state: "acknowledged" }, "Notification settings saved remotely."],
    ]

    const view = await render(
      <NotificationSyncStatus status={states[0][0]} retry={retry} />,
    )
    expect(announce).toHaveBeenLastCalledWith(states[0][1])

    for (const [status, message] of states.slice(1)) {
      await view.rerender(
        <NotificationSyncStatus status={status} retry={retry} />,
      )
      expect(announce).toHaveBeenLastCalledWith(message)
    }
    expect(announce).toHaveBeenCalledTimes(states.length)
    announce.mockRestore()
  })

  it("keeps the localized Retry action focused on the shared retry command", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => undefined)
    const retry = jest.fn()
    const view = await render(
      <NotificationSyncStatus status={{ state: "error" }} retry={retry} />,
    )

    const retryAction = view.getByTestId("notifications-retry")
    expect(retryAction.props.accessibilityLabel).toBe(
      "Retry saving notification preferences",
    )
    await fireEvent.press(retryAction)
    expect(retry).toHaveBeenCalledTimes(1)
    announce.mockRestore()
  })
})
