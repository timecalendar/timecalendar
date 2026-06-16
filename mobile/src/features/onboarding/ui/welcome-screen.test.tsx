import { fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"

import WelcomeScreen from "./welcome-screen"

// Presentational (70% floor): renders the welcome surface through the real theme +
// i18n trees (mirrors settings/ui + school-picker). Asserts the localized title +
// a value-prop line render (not raw keys), the title carries the encoded heading
// role, and activating the CTA pushes the school step (mocked router.push). The
// screen owns no data — render + one navigation only.
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

const mockPush = router.push as jest.Mock

beforeEach(() => {
  mockPush.mockClear()
})

describe("WelcomeScreen", () => {
  it("renders the localized title and value-prop copy (not raw keys)", async () => {
    const { getByText } = await render(<WelcomeScreen />)

    // EN catalog values (jest-expo device locale resolves to en).
    expect(getByText("TimeCalendar")).toBeTruthy()
    expect(getByText("Your schedule, all in one place.")).toBeTruthy()
    expect(getByText("All your classes in one calendar.")).toBeTruthy()
  })

  it("exposes the title as a heading (the encoded ThemedText contract)", async () => {
    const { getByRole } = await render(<WelcomeScreen />)

    expect(getByRole("header").props.children).toBe("TimeCalendar")
  })

  it("navigates to the school step when the CTA is activated", async () => {
    const { getByTestId } = await render(<WelcomeScreen />)

    fireEvent.press(getByTestId("onboarding-welcome-cta"))
    expect(mockPush).toHaveBeenCalledWith("/onboarding/school")
  })

  it("navigates to the QR scan step when the scan CTA is activated", async () => {
    const { getByTestId } = await render(<WelcomeScreen />)

    fireEvent.press(getByTestId("onboarding-welcome-scan-cta"))
    expect(mockPush).toHaveBeenCalledWith("/onboarding/qr-scan")
  })

  it("navigates to the iCal URL step when the add-by-URL CTA is activated", async () => {
    const { getByTestId } = await render(<WelcomeScreen />)

    fireEvent.press(getByTestId("onboarding-welcome-url-cta"))
    expect(mockPush).toHaveBeenCalledWith("/onboarding/ical-url")
  })

  it("declares an accessible CTA (role + translated label)", async () => {
    const { getByTestId } = await render(<WelcomeScreen />)

    const cta = getByTestId("onboarding-welcome-cta")
    expect(cta.props.accessibilityRole).toBe("button")
    expect(cta.props.accessibilityLabel).toBe("Get started, choose your school")
  })
})
