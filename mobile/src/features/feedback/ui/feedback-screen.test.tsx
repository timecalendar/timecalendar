import { act, fireEvent, render, waitFor } from "@testing-library/react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Alert } from "react-native"

import {
  getRememberedEmail,
  setRememberedEmail,
  useSendFeedback,
} from "@/features/feedback/data"
import i18n from "@/i18n"

import FeedbackScreen, { normalizeFeedbackParam } from "./feedback-screen"

jest.mock("expo-router", () => ({
  router: { back: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: jest.fn(),
}))
jest.mock("@/features/feedback/data", () => ({
  getRememberedEmail: jest.fn(),
  setRememberedEmail: jest.fn(),
  useSendFeedback: jest.fn(),
}))

const mockParams = useLocalSearchParams as jest.Mock
const mockUseSendFeedback = useSendFeedback as jest.Mock
const mockGetRememberedEmail = getRememberedEmail as jest.Mock
const sendFeedback = jest.fn()
const reset = jest.fn()

beforeEach(async () => {
  jest.clearAllMocks()
  await i18n.changeLanguage("en")
  mockParams.mockReturnValue({})
  mockGetRememberedEmail.mockReturnValue("")
  mockUseSendFeedback.mockReturnValue({
    sendFeedback,
    isPending: false,
    failed: false,
    reset,
  })
})

it("normalizes scalar, array, empty, and bounded route params", () => {
  expect(normalizeFeedbackParam(" value ")).toBe("value")
  expect(normalizeFeedbackParam([" first ", "second"])).toBe("first")
  expect(normalizeFeedbackParam(" ")).toBeUndefined()
  expect(normalizeFeedbackParam(undefined)).toBeUndefined()
  expect(normalizeFeedbackParam("a".repeat(3_000))).toHaveLength(2_048)
})

it("renders accessible fields and rejects an empty form locally", async () => {
  const { getAllByRole, getByTestId, getByText } = await render(
    <FeedbackScreen />,
  )
  expect(getAllByRole("header").length).toBeGreaterThan(0)
  expect(getByTestId("feedback-email-input").props.returnKeyType).toBe("next")
  expect(getByTestId("feedback-message-input").props.multiline).toBe(true)
  await act(async () => fireEvent.press(getByTestId("feedback-submit")))
  expect(
    getByText("Enter your e-mail address.").props.accessibilityLiveRegion,
  ).toBe("polite")
  expect(getByText("Enter your message.").props.accessibilityRole).toBe("alert")
  expect(sendFeedback).not.toHaveBeenCalled()
})

it("prefills remembered e-mail and submits normalized values with route context", async () => {
  mockGetRememberedEmail.mockReturnValue("remembered@example.fr")
  mockParams.mockReturnValue({
    calendarUrl: [" https://example.fr/a.ics "],
    schoolId: "school",
    schoolName: "University",
    calendarName: "  L3 Informatique  ",
  })
  sendFeedback.mockResolvedValue(true)
  const alert = jest.spyOn(Alert, "alert").mockImplementation()
  const { getByTestId } = await render(<FeedbackScreen />)
  expect(getByTestId("feedback-email-input").props.value).toBe(
    "remembered@example.fr",
  )
  await act(async () =>
    fireEvent.changeText(getByTestId("feedback-message-input"), "Hello"),
  )
  await act(async () => fireEvent.press(getByTestId("feedback-submit")))
  await waitFor(() =>
    expect(sendFeedback).toHaveBeenCalledWith({
      email: "remembered@example.fr",
      message: "Hello",
      calendarUrl: "https://example.fr/a.ics",
      schoolId: "school",
      schoolName: "University",
      calendarName: "L3 Informatique",
    }),
  )
  expect(setRememberedEmail).toHaveBeenCalledWith("remembered@example.fr")
  expect(alert).toHaveBeenCalledWith(
    "Message sent",
    "Thanks for your message!",
    [expect.objectContaining({ text: "Close" })],
  )
  const close = alert.mock.calls[0]?.[2]?.[0]
  close?.onPress?.()
  expect(router.back).toHaveBeenCalled()
  alert.mockRestore()
})

it.each([
  ["en", "Your message was not sent. Please try again."],
  ["fr", "Votre message n’a pas été envoyé. Veuillez réessayer."],
] as const)(
  "retains input, announces retry guidance, and permits retry after a 503 in %s",
  async (locale, guidance) => {
    await i18n.changeLanguage(locale)
    mockUseSendFeedback.mockReturnValue({
      sendFeedback,
      isPending: false,
      failed: true,
      reset,
    })
    sendFeedback.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    const alert = jest.spyOn(Alert, "alert").mockImplementation()
    const { getByTestId, getByText } = await render(<FeedbackScreen />)
    await act(async () =>
      fireEvent.changeText(
        getByTestId("feedback-email-input"),
        "student@example.fr",
      ),
    )
    await act(async () =>
      fireEvent.changeText(
        getByTestId("feedback-message-input"),
        "Private message",
      ),
    )
    await act(async () => fireEvent.press(getByTestId("feedback-submit")))

    const error = getByText(guidance)
    expect(error.props.accessibilityRole).toBe("alert")
    expect(error.props.accessibilityLiveRegion).toBe("polite")
    expect(getByTestId("feedback-email-input").props.value).toBe(
      "student@example.fr",
    )
    expect(getByTestId("feedback-message-input").props.value).toBe(
      "Private message",
    )
    expect(
      getByTestId("feedback-submit").props.accessibilityState.disabled,
    ).toBe(false)

    await act(async () => fireEvent.press(getByTestId("feedback-submit")))
    expect(sendFeedback).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(alert).toHaveBeenCalled())
    alert.mockRestore()
  },
)

it("disables duplicate submit and exposes pending status", async () => {
  mockUseSendFeedback.mockReturnValue({
    sendFeedback,
    isPending: true,
    failed: false,
    reset,
  })
  const { getByTestId, getByText } = await render(<FeedbackScreen />)
  expect(getByTestId("feedback-submit").props.accessibilityState).toEqual({
    disabled: true,
    busy: true,
  })
  expect(getByText("Sending…").props.accessibilityLiveRegion).toBe("polite")
  fireEvent.press(getByTestId("feedback-submit"))
  expect(sendFeedback).not.toHaveBeenCalled()
})

it("synchronously ignores a rapid second submit before pending renders", async () => {
  sendFeedback.mockResolvedValue(false)
  const { getByTestId } = await render(<FeedbackScreen />)
  await act(async () => {
    fireEvent.changeText(
      getByTestId("feedback-email-input"),
      "student@example.fr",
    )
    fireEvent.changeText(getByTestId("feedback-message-input"), "Hello")
  })
  await act(async () => {
    fireEvent.press(getByTestId("feedback-submit"))
    fireEvent.press(getByTestId("feedback-submit"))
    await Promise.resolve()
  })

  expect(sendFeedback).toHaveBeenCalledTimes(1)
})
