import { render, screen } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import {
  CalendarAddFab,
  CalendarHeaderActions,
} from "./calendar-screen-actions"
import { CalendarViewMenu } from "./calendar-view-menu"

const mockIcon = jest.fn()
jest.mock("@/design", () => ({
  ...jest.requireActual("@/design"),
  Icon: (props: unknown) => {
    mockIcon(props)
    return null
  },
}))

beforeEach(() => mockIcon.mockClear())

describe.each(["ios", "android"] as const)("Calendar header on %s", (os) => {
  usePlatform(os)

  it("tints header items with the label color", async () => {
    await render(
      <>
        <CalendarHeaderActions onToday={jest.fn()} onAdd={jest.fn()} />
        <CalendarViewMenu view="week" onChange={jest.fn()} zoom={null} />
      </>,
    )

    expect(mockIcon).toHaveBeenCalled()
    for (const [props] of mockIcon.mock.calls) {
      expect(props).toEqual(
        expect.objectContaining({
          color: Colors.light.text,
          scaling: "fixed",
        }),
      )
    }
    expect(
      StyleSheet.flatten(
        screen.getByTestId("calendar-view-chevron").props.style,
      ).borderColor,
    ).toBe(Colors.light.text)
  })

  it("keeps the add FAB brand-filled", async () => {
    await render(<CalendarAddFab onPress={jest.fn()} />)

    expect(
      StyleSheet.flatten(screen.getByTestId("calendar-fab").props.style)
        .backgroundColor,
    ).toBe(Colors.light.primary)
  })
})
