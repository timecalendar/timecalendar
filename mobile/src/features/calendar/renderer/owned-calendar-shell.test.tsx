import { render, screen } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { formatFullDay } from "@/features/calendar/data"
import { Colors } from "@/theme"

import { OwnedCalendarShell } from "./owned-calendar-shell"

describe("OwnedCalendarShell", () => {
  it.each([
    ["en" as const, "Europe/Paris", "Monday, June 15th, 2026"],
    ["fr" as const, "Europe/Paris", "lundi 15 juin 2026"],
    ["en" as const, "Pacific/Noumea", "Tuesday, June 16th, 2026"],
  ])("renders the %s heading in %s", async (locale, zone, expected) => {
    const selectedDate = new Date("2026-06-15T13:30:00.000Z")
    await render(
      <OwnedCalendarShell
        heading={formatFullDay(selectedDate, locale, zone)}
      />,
    )

    expect(screen.getByRole("header", { name: expected })).toBeOnTheScreen()
    expect(screen.getByTestId("owned-calendar-canvas")).toBeOnTheScreen()
  })

  it("fills its owner with theme-backed shell and canvas colors", async () => {
    await render(<OwnedCalendarShell heading="Monday, June 15th, 2026" />)

    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-shell").props.style,
      ),
    ).toMatchObject({ flex: 1, backgroundColor: Colors.light.background })
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-canvas").props.style,
      ),
    ).toMatchObject({
      flex: 1,
      backgroundColor: Colors.light.backgroundElement,
      borderColor: Colors.light.separator,
    })
  })
})
