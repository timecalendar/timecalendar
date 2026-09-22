import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { StyleSheet, Text } from "react-native"

import { setBackendRuntimeReady } from "@/config/backend-runtime"
import { setCrashlyticsAttributes } from "@/firebase"
import { readBackendResetJournal } from "@/storage"

import { EnvironmentRuntimeGate } from "./environment-runtime-gate"

let mockScheme: "light" | "dark" = "light"
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => mockScheme,
}))

const mockEnvironment = "preprod"
const mockRecover = jest.fn()

jest.mock("@/features/environment/data/store", () => ({
  useEffectiveBackendEnvironment: () => mockEnvironment,
}))

jest.mock("@/features/environment/data/switch", () => ({
  recoverBackendEnvironmentSwitch: (...args: unknown[]) => mockRecover(...args),
}))

jest.mock("@/storage", () => ({
  readBackendResetJournal: jest.fn(),
}))

jest.mock("@/firebase", () => ({
  setCrashlyticsAttributes: jest.fn(),
}))

const mockReadJournal = readBackendResetJournal as jest.Mock
const mockAttributes = setCrashlyticsAttributes as jest.Mock

beforeEach(() => {
  mockScheme = "light"
  mockRecover.mockReset().mockResolvedValue("switched")
  mockReadJournal.mockReset().mockReturnValue({ state: "absent" })
  mockAttributes.mockReset().mockResolvedValue(undefined)
  setBackendRuntimeReady(true)
})

it("mounts children only with no journal and records safe diagnostics", async () => {
  await render(
    <EnvironmentRuntimeGate>
      <Text>normal routes</Text>
    </EnvironmentRuntimeGate>,
  )
  expect(screen.getByText("normal routes")).toBeTruthy()
  await waitFor(() =>
    expect(mockAttributes).toHaveBeenCalledWith({
      backendEnvironment: "preprod",
    }),
  )
})

it("blocks children and resumes a valid cold-start journal", async () => {
  const journal = { version: 1, current: "preprod", target: "production" }
  mockReadJournal.mockReturnValue({ state: "valid", journal })

  await render(
    <EnvironmentRuntimeGate>
      <Text>normal routes</Text>
    </EnvironmentRuntimeGate>,
  )

  expect(screen.queryByText("normal routes")).toBeNull()
  expect(screen.getByText("Finishing environment switch…")).toBeTruthy()
  await waitFor(() => expect(mockRecover).toHaveBeenCalledWith(journal))
})

it("fails malformed journals closed and exposes an accessible retry", async () => {
  mockReadJournal.mockReturnValue({ state: "malformed" })
  mockRecover.mockRejectedValueOnce(new Error("reset failed"))

  await render(
    <EnvironmentRuntimeGate>
      <Text>normal routes</Text>
    </EnvironmentRuntimeGate>,
  )

  await waitFor(() =>
    expect(screen.getByText("Environment switch incomplete")).toBeTruthy(),
  )
  expect(screen.queryByText("normal routes")).toBeNull()
  expect(
    screen.getByTestId("backend-environment-retry").props.accessibilityRole,
  ).toBe("button")

  fireEvent.press(screen.getByTestId("backend-environment-retry"))
  await waitFor(() => expect(mockRecover).toHaveBeenCalledTimes(2))
})

it("keeps progress neutral and renders dark recovery before navigation providers", async () => {
  mockScheme = "dark"
  mockReadJournal.mockReturnValue({ state: "malformed" })
  mockRecover.mockReturnValue(new Promise(() => {}))
  await render(
    <EnvironmentRuntimeGate>
      <Text>normal routes</Text>
    </EnvironmentRuntimeGate>,
  )
  expect(screen.queryByRole("alert")).toBeNull()
  expect(screen.queryByTestId("backend-environment-retry")).toBeNull()
  const owner = screen.getByTestId("backend-environment-recovery").parent!
  expect(StyleSheet.flatten(owner.props.style).backgroundColor).toBe("#000000")
})
