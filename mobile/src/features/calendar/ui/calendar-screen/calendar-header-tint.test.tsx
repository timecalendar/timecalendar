import { render, screen } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import {
  CalendarAddFab,
  CalendarHeaderActions,
} from "./calendar-screen-actions"
import { CalendarViewMenu } from "./calendar-view-menu"

const mockSymbolView = jest.fn()
jest.mock("expo-symbols", () => ({
  SymbolView: (props: unknown) => {
    mockSymbolView(props)
    return null
  },
}))

beforeEach(() => mockSymbolView.mockClear())

describe.each(["ios", "android"] as const)("Calendar header on %s", (os) => {
  usePlatform(os)

  it("tints header items with the label color", async () => {
    await render(
      <>
        <CalendarHeaderActions onToday={jest.fn()} onAdd={jest.fn()} />
        <CalendarViewMenu view="week" onChange={jest.fn()} zoom={null} />
      </>,
    )

    expect(mockSymbolView).toHaveBeenCalled()
    for (const [props] of mockSymbolView.mock.calls) {
      expect(props).toEqual(
        expect.objectContaining({ tintColor: Colors.light.text }),
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
