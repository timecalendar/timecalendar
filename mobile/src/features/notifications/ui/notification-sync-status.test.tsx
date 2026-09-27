import { fireEvent, render } from "@testing-library/react-native"
import { AccessibilityInfo } from "react-native"

import type { NotificationSyncStatus as SyncStatus } from "@/features/notifications/data"
import { usePlatform } from "@/test-support/platform"

import { NotificationSyncStatus } from "./notification-sync-status"

describe.each(["ios", "android"] as const)(
  "NotificationSyncStatus on %s",
  (platform) => {
    usePlatform(platform)
    beforeEach(() => jest.clearAllMocks())

    it.each<SyncStatus>([
      { state: "pending" },
      { state: "waiting", reason: "registration" },
      { state: "waiting", reason: "calendars" },
      { state: "acknowledged" },
    ])("renders and announces nothing while %o", async (status) => {
      const announce = jest
        .spyOn(AccessibilityInfo, "announceForAccessibility")
        .mockImplementation(() => undefined)
      const queued = jest
        .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
        .mockImplementation(() => undefined)
      const view = await render(
        <NotificationSyncStatus status={status} retry={jest.fn()} />,
      )
      expect(view.toJSON()).toBeNull()
      expect(announce).not.toHaveBeenCalled()
      expect(queued).not.toHaveBeenCalled()
      queued.mockRestore()
      announce.mockRestore()
    })

    it("announces the failure and routes Retry to the shared command", async () => {
      const announce = jest
        .spyOn(AccessibilityInfo, "announceForAccessibility")
        .mockImplementation(() => undefined)
      const queued = jest
        .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
        .mockImplementation(() => undefined)
      const retry = jest.fn()
      const view = await render(
        <NotificationSyncStatus status={{ state: "error" }} retry={retry} />,
      )

      expect(view.getByTestId("notifications-sync-error")).toBeOnTheScreen()
      expect(view.getByTestId("notifications-sync-message")).toHaveTextContent(
        "Notification settings are saved on this device but not yet remotely.",
      )
      const spoken =
        "Could not sync. Notification settings are saved on this device but not yet remotely."
      if (platform === "ios") {
        expect(queued).toHaveBeenCalledWith(spoken, { queue: true })
      } else {
        expect(announce).toHaveBeenCalledWith(spoken)
      }

      const retryAction = view.getByTestId("notifications-retry")
      if (platform === "ios") {
        expect(retryAction.props.accessibilityLabel).toBe(
          "Retry saving notification preferences",
        )
      } else {
        expect(retryAction).toHaveTextContent("Retry")
      }
      await fireEvent.press(retryAction)
      expect(retry).toHaveBeenCalledTimes(1)
      queued.mockRestore()
      announce.mockRestore()
    })
  },
)
