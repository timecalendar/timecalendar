import { fireEvent, render, screen } from "@testing-library/react-native"
import { Alert } from "react-native"

import { EnvironmentSettingsControl } from "./environment-settings-control"

let mockCapability: "development" | "preview" | "production" = "preview"
let mockEnvironment: "local" | "preprod" | "production" = "preprod"
const mockSwitch = jest.fn()

jest.mock("@/features/environment/data", () => ({
  getBackendEnvironmentCapability: () => mockCapability,
  useEffectiveBackendEnvironment: () => mockEnvironment,
  switchBackendEnvironment: (...args: unknown[]) => mockSwitch(...args),
}))

jest.mock("expo-symbols", () => ({ SymbolView: () => null }))

beforeEach(() => {
  mockCapability = "preview"
  mockEnvironment = "preprod"
  mockSwitch.mockReset().mockResolvedValue("switched")
  jest.spyOn(Alert, "alert").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

it("is absent and inert in production", async () => {
  mockCapability = "production"
  await render(<EnvironmentSettingsControl />)
  expect(screen.queryByTestId("settings-environment")).toBeNull()
  expect(Alert.alert).not.toHaveBeenCalled()
})

it("offers only preview choices and requires destructive confirmation", async () => {
  await render(<EnvironmentSettingsControl />)
  const row = screen.getByTestId("settings-environment")
  expect(row.props.accessibilityRole).toBe("button")
  expect(screen.getByText("Preproduction")).toBeTruthy()
  expect(row.props.accessibilityLabel).toBe("Environment, Preproduction")

  fireEvent.press(row)
  const choiceButtons = (Alert.alert as jest.Mock).mock.calls[0]?.[2] as {
    text: string
    onPress?: () => void
  }[]
  expect(choiceButtons.map(({ text }) => text)).toEqual([
    "Preproduction",
    "Production",
    "Cancel",
  ])
  choiceButtons[1]?.onPress?.()
  expect(mockSwitch).not.toHaveBeenCalled()

  const confirmationButtons = (Alert.alert as jest.Mock).mock.calls[1]?.[2] as {
    text: string
    onPress?: () => void
  }[]
  confirmationButtons[0]?.onPress?.()
  expect(mockSwitch).not.toHaveBeenCalled()

  choiceButtons[1]?.onPress?.()
  const secondConfirmation = (Alert.alert as jest.Mock).mock.calls[2]?.[2] as {
    text: string
    onPress?: () => void
  }[]
  secondConfirmation[1]?.onPress?.()
  expect(mockSwitch).toHaveBeenCalledWith("production")
})

it("adds local only for the development capability", async () => {
  mockCapability = "development"
  mockEnvironment = "local"
  await render(<EnvironmentSettingsControl />)
  const row = screen.getByTestId("settings-environment")
  expect(screen.getByText("Local")).toBeTruthy()
  expect(row.props.accessibilityLabel).toBe("Environment, Local")

  fireEvent.press(row)

  const buttons = (Alert.alert as jest.Mock).mock.calls[0]?.[2] as {
    text: string
  }[]
  expect(buttons.map(({ text }) => text)).toEqual([
    "Local",
    "Preproduction",
    "Production",
    "Cancel",
  ])
})
