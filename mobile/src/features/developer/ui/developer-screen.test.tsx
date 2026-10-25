import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { router } from "expo-router"
import type { ReactNode } from "react"

import { NativeTextEntryDialog } from "@/components/chrome"
import { usePlatform } from "@/test-support/platform"

import { DeveloperScreen } from "./developer-screen"

jest.mock("expo-router", () => {
  const { Text: MockText } = jest.requireActual("react-native")
  return {
    router: { push: jest.fn() },
    Redirect: ({ href }: { href: string }) => (
      <MockText testID="redirect">{href}</MockText>
    ),
    Stack: { Screen: (): ReactNode => null },
  }
})

// Wrapped so a test can submit a native buffer that differs from the last
// onChange snapshot, the race the screen's trimmed recheck guards against.
jest.mock("@/components/chrome", () => {
  const actual = jest.requireActual("@/components/chrome")
  return {
    ...actual,
    NativeTextEntryDialog: jest.fn(actual.NativeTextEntryDialog),
  }
})

let mockCapability: "development" | "preview" | "production" = "development"
jest.mock("@/features/environment", () => {
  const { Text: MockText } = jest.requireActual("react-native")
  return {
    getBackendEnvironmentCapability: () => mockCapability,
    EnvironmentSettingsControl: () => (
      <MockText testID="settings-environment">Environment</MockText>
    ),
  }
})

let mockDevVariant = true
jest.mock("@/config/variant", () => ({
  isDevVariant: () => mockDevVariant,
}))

const mockPush = router.push as jest.Mock

const developerIds = [
  "developer-section-backend",
  "developer-section-test-data",
  "developer-section-design",
  "developer-dev-import",
  "developer-gallery",
]

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID))
  })
}

async function type(value: string) {
  await act(async () => {
    fireEvent.changeText(
      screen.getByTestId("developer-dev-import-input"),
      value,
    )
  })
}

beforeEach(() => {
  mockCapability = "development"
  mockDevVariant = true
  mockPush.mockReset()
})

it("redirects to Settings in production", async () => {
  mockCapability = "production"
  await render(<DeveloperScreen />)
  expect(screen.getByTestId("redirect")).toHaveTextContent("/settings")
  for (const id of developerIds) {
    expect(screen.queryByTestId(id)).toBeNull()
  }
})

describe.each(["ios", "android"] as const)(
  "DeveloperScreen on %s",
  (platform) => {
    usePlatform(platform)

    it("orders the backend, test data and design sections", async () => {
      await render(<DeveloperScreen />)
      expect(
        screen
          .getAllByTestId(/^developer-section-/)
          .map((node) => node.props.testID),
      ).toEqual([
        "developer-section-backend",
        "developer-section-test-data",
        "developer-section-design",
      ])
      expect(screen.getByTestId("settings-environment")).toBeOnTheScreen()
    })

    it("hides the dev import outside the development variant", async () => {
      mockCapability = "preview"
      mockDevVariant = false
      await render(<DeveloperScreen />)
      expect(screen.queryByTestId("developer-section-test-data")).toBeNull()
      expect(screen.queryByTestId("developer-dev-import")).toBeNull()
      expect(screen.getByTestId("developer-gallery")).toBeOnTheScreen()
    })

    it("opens the settings gallery", async () => {
      await render(<DeveloperScreen />)
      await press("developer-gallery")
      expect(mockPush).toHaveBeenCalledWith("/settings-gallery")
    })

    it("imports a trimmed token and closes the dialog", async () => {
      await render(<DeveloperScreen />)
      expect(screen.queryByTestId("developer-dev-import-dialog")).toBeNull()
      await press("developer-dev-import")
      expect(screen.getByTestId("developer-dev-import-dialog")).toBeTruthy()
      const input = screen.getByTestId("developer-dev-import-input")
      expect(input.props.autoCapitalize).toBe("none")
      expect(input.props.autoCorrect).toBe(false)
      await type("  abc123 ")
      await press("developer-dev-import-submit")
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/dev-import",
        params: { token: "abc123" },
      })
      expect(screen.queryByTestId("developer-dev-import-dialog")).toBeNull()
    })

    it("keeps submit disabled for a blank token", async () => {
      await render(<DeveloperScreen />)
      await press("developer-dev-import")
      await type("   ")
      expect(
        screen.getByTestId("developer-dev-import-submit").props
          .accessibilityState.disabled,
      ).toBe(true)
      await press("developer-dev-import-submit")
      expect(mockPush).not.toHaveBeenCalled()
      expect(screen.getByTestId("developer-dev-import-dialog")).toBeTruthy()
    })

    it("rechecks the native buffer on submit", async () => {
      await render(<DeveloperScreen />)
      await press("developer-dev-import")
      await type("abc123")
      const [props] = jest.mocked(NativeTextEntryDialog).mock.lastCall!
      await act(async () => {
        props.onSubmit("  ")
      })
      expect(mockPush).not.toHaveBeenCalled()
      expect(screen.getByTestId("developer-dev-import-dialog")).toBeTruthy()
    })

    it("closes on cancel without importing", async () => {
      await render(<DeveloperScreen />)
      await press("developer-dev-import")
      await press("developer-dev-import-cancel")
      expect(screen.queryByTestId("developer-dev-import-dialog")).toBeNull()
      expect(mockPush).not.toHaveBeenCalled()
    })
  },
)
