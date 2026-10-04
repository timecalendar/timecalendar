import { render, screen } from "@testing-library/react-native"
import { Text } from "react-native"

import { remove, setString, STORAGE_KEYS } from "@/storage"

import { StartupTabsGate } from "./startup-tabs-gate"

let mockPathname = "/"
const mockRedirect = jest.fn()
jest.mock("expo-router", () => ({
  usePathname: () => mockPathname,
  Redirect: (props: unknown) => {
    mockRedirect(props)
    return null
  },
}))
beforeEach(() => {
  mockPathname = "/"
  mockRedirect.mockClear()
  remove(STORAGE_KEYS.startupTab)
})
const tree = () => (
  <StartupTabsGate>
    <Text>Tabs</Text>
  </StartupTabsGate>
)

it("lands on the migrated calendar tab before mounting changelog and permits returning Home", async () => {
  setString(STORAGE_KEYS.startupTab, "calendar")
  const view = await render(tree())
  expect(mockRedirect).toHaveBeenCalledWith({ href: "/calendar" })
  expect(screen.queryByText("Tabs")).toBeNull()
  mockPathname = "/calendar"
  await view.rerender(tree())
  mockPathname = "/"
  await view.rerender(tree())
  expect(screen.getByText("Tabs")).toBeTruthy()
})

it.each(["/", "/calendar", "/event-details/cold-notification"])(
  "preserves explicit routes and the normal Home default at %s",
  async (pathname) => {
    mockPathname = pathname
    if (pathname !== "/") setString(STORAGE_KEYS.startupTab, "calendar")
    await render(tree())
    expect(mockRedirect).not.toHaveBeenCalled()
    expect(screen.getByText("Tabs")).toBeTruthy()
  },
)
