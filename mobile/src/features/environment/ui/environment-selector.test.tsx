import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Alert } from "react-native"

import { usePlatform } from "@/test-support/platform"

import { EnvironmentSelectorDialog } from "./environment-selector-dialog"
import { EnvironmentSettingsRow } from "./environment-settings-row"
import { useEnvironmentSelector } from "./use-environment-selector"

let mockCapability: "development" | "preview" | "production" = "preview"
let mockEnvironment: "local" | "preprod" | "production" = "preprod"
const mockSwitch = jest.fn()

jest.mock("@/features/environment/data", () => ({
  getBackendEnvironmentCapability: () => mockCapability,
  useEffectiveBackendEnvironment: () => mockEnvironment,
  switchBackendEnvironment: (...args: unknown[]) => mockSwitch(...args),
}))

function EnvironmentSelectorHarness() {
  const selector = useEnvironmentSelector()
  return (
    <>
      <EnvironmentSettingsRow selector={selector} />
      <EnvironmentSelectorDialog selector={selector} />
    </>
  )
}

beforeEach(() => {
  mockCapability = "preview"
  mockEnvironment = "preprod"
  mockSwitch.mockReset().mockResolvedValue("switched")
  jest.spyOn(Alert, "alert").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("on iOS", () => {
  usePlatform("ios")

  it("is absent and inert in production", async () => {
    mockCapability = "production"
    await render(<EnvironmentSelectorHarness />)
    expect(screen.queryByTestId("settings-environment")).toBeNull()
    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it("offers only preview choices and requires destructive confirmation", async () => {
    await render(<EnvironmentSelectorHarness />)
    const row = screen.getByTestId("settings-environment")
    expect(row.props.accessibilityRole).toBe("button")
    expect(screen.getByText("Preproduction")).toBeTruthy()
    expect(row.props.accessibilityLabel).toBe("Environment")
    expect(row.props.accessibilityValue).toEqual({ text: "Preproduction" })

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

    const confirmationButtons = (Alert.alert as jest.Mock).mock
      .calls[1]?.[2] as {
      text: string
      onPress?: () => void
    }[]
    confirmationButtons[0]?.onPress?.()
    expect(mockSwitch).not.toHaveBeenCalled()

    choiceButtons[1]?.onPress?.()
    const secondConfirmation = (Alert.alert as jest.Mock).mock
      .calls[2]?.[2] as {
      text: string
      onPress?: () => void
    }[]
    secondConfirmation[1]?.onPress?.()
    expect(mockSwitch).toHaveBeenCalledWith("production")
  })

  it("adds local only for the development capability", async () => {
    mockCapability = "development"
    mockEnvironment = "local"
    await render(<EnvironmentSelectorHarness />)
    const row = screen.getByTestId("settings-environment")
    expect(screen.getByText("Local")).toBeTruthy()
    expect(row.props.accessibilityLabel).toBe("Environment")
    expect(row.props.accessibilityValue).toEqual({ text: "Local" })

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
})

describe("on Android", () => {
  usePlatform("android")

  const choiceTestID = (environment: string) =>
    `settings-environment-dialog-${environment}`

  it("is absent and inert in production", async () => {
    mockCapability = "production"
    await render(<EnvironmentSelectorHarness />)
    expect(screen.queryByTestId("settings-environment")).toBeNull()
    expect(screen.queryByTestId("settings-environment-dialog")).toBeNull()
  })

  it("lists every development environment in a radio dialog with the current one selected", async () => {
    mockCapability = "development"
    mockEnvironment = "local"
    await render(<EnvironmentSelectorHarness />)
    expect(screen.queryByTestId("settings-environment-dialog")).toBeNull()

    await fireEvent.press(screen.getByTestId("settings-environment"))

    expect(Alert.alert).not.toHaveBeenCalled()
    expect(screen.getByText("Choose an environment")).toBeTruthy()
    for (const [environment, label] of [
      ["local", "Local"],
      ["preprod", "Preproduction"],
      ["production", "Production"],
    ] as const) {
      const choice = screen.getByTestId(choiceTestID(environment))
      expect(choice).toHaveTextContent(label)
      expect(choice.props.accessibilityState.selected).toBe(
        environment === "local",
      )
    }
  })

  it("cancels without an alert or a switch, and reopens", async () => {
    mockCapability = "development"
    await render(<EnvironmentSelectorHarness />)

    await fireEvent.press(screen.getByTestId("settings-environment"))
    await fireEvent.press(
      screen.getByTestId("settings-environment-dialog-cancel"),
    )

    expect(screen.queryByTestId("settings-environment-dialog")).toBeNull()
    expect(Alert.alert).not.toHaveBeenCalled()
    expect(mockSwitch).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByTestId("settings-environment"))
    expect(screen.getByTestId("settings-environment-dialog")).toBeTruthy()
  })

  it("treats the current environment as inert", async () => {
    mockCapability = "development"
    await render(<EnvironmentSelectorHarness />)

    await fireEvent.press(screen.getByTestId("settings-environment"))
    await fireEvent.press(screen.getByTestId(choiceTestID("preprod")))

    expect(screen.queryByTestId("settings-environment-dialog")).toBeNull()
    expect(Alert.alert).not.toHaveBeenCalled()
    expect(mockSwitch).not.toHaveBeenCalled()
  })

  it("switches to another environment once after destructive confirmation", async () => {
    mockCapability = "development"
    await render(<EnvironmentSelectorHarness />)

    await fireEvent.press(screen.getByTestId("settings-environment"))
    await fireEvent.press(screen.getByTestId(choiceTestID("local")))

    expect(screen.queryByTestId("settings-environment-dialog")).toBeNull()
    const buttons = (Alert.alert as jest.Mock).mock.calls[0]?.[2] as {
      text: string
      style?: string
      onPress?: () => void
    }[]
    expect(buttons.map(({ text, style }) => [text, style])).toEqual([
      ["Cancel", "cancel"],
      ["Clear and switch", "destructive"],
    ])
    await act(async () => {
      buttons[1]?.onPress?.()
    })
    expect(mockSwitch).toHaveBeenCalledTimes(1)
    expect(mockSwitch).toHaveBeenCalledWith("local")
  })

  it("restores the current environment when the switch fails", async () => {
    mockCapability = "development"
    let rejectSwitch: (error: Error) => void = () => {}
    mockSwitch.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectSwitch = reject
      }),
    )
    await render(<EnvironmentSelectorHarness />)

    await fireEvent.press(screen.getByTestId("settings-environment"))
    await fireEvent.press(screen.getByTestId(choiceTestID("local")))
    const buttons = (Alert.alert as jest.Mock).mock.calls[0]?.[2] as {
      onPress?: () => void
    }[]
    await act(async () => {
      buttons[1]?.onPress?.()
    })
    expect(screen.getByTestId("settings-environment")).toHaveTextContent(
      /Clearing local data…/,
    )

    await fireEvent.press(screen.getByTestId("settings-environment"))
    expect(screen.queryByTestId("settings-environment-dialog")).toBeNull()

    await act(async () => {
      rejectSwitch(new Error("offline"))
    })
    expect(screen.getByTestId("settings-environment")).toHaveTextContent(
      /Preproduction/,
    )
  })
})
