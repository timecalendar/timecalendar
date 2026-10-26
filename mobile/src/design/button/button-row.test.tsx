import { fireEvent, render, screen } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { usePlatform } from "@/test-support/platform"

import { Button } from "./button"
import { ButtonRow } from "./button-row"

let mockFontScale = 1
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({
    width: 390,
    height: 844,
    scale: 3,
    fontScale: mockFontScale,
  }),
}))

const onBack = jest.fn()
const onContinue = jest.fn()

beforeEach(() => {
  mockFontScale = 1
  onBack.mockClear()
  onContinue.mockClear()
})

function Row({ style }: { style?: { marginTop: number } }) {
  return (
    <ButtonRow
      testID="row"
      style={style}
      secondary={
        <Button
          variant="outlined"
          label="Back"
          onPress={onBack}
          testID="back"
        />
      }
      primary={
        <Button
          variant="filled"
          label="Continue"
          onPress={onContinue}
          testID="continue"
        />
      }
    />
  )
}

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style)

const order = () =>
  screen.getAllByRole("button").map((button) => button.props.testID as string)

const wrapper = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).parent?.props.style)

const cases = {
  ios: { row: [1, 1.353], stacked: [1.786, 3.571] },
  android: { row: [1, 1.5], stacked: [1.8, 2, 3.571] },
} as const

describe.each(["ios", "android"] as const)("ButtonRow on %s", (os) => {
  usePlatform(os)

  it.each(cases[os].row)(
    "lays the pair side by side at font scale %d",
    async (scale) => {
      mockFontScale = scale
      await render(<Row />)
      expect(flat("row")).toMatchObject({
        flexDirection: "row",
        alignItems: "center",
      })
      expect(order()).toEqual(["back", "continue"])
      expect(wrapper("continue")).toEqual({ flex: 1 })
      expect(wrapper("back")).toEqual({ flexShrink: 1, maxWidth: "50%" })
    },
  )

  it.each(cases[os].stacked)(
    "stacks the pair, primary first, at font scale %d",
    async (scale) => {
      mockFontScale = scale
      await render(<Row />)
      expect(flat("row")).toMatchObject({
        flexDirection: "column",
        alignItems: "stretch",
      })
      expect(order()).toEqual(["continue", "back"])
      expect(wrapper("continue")).toBeUndefined()
      expect(wrapper("back")).toBeUndefined()
    },
  )
})

it("re-lays out on a live font scale change without remounting", async () => {
  const view = await render(<Row />)
  const continueButton = screen.getByTestId("continue")
  expect(order()).toEqual(["back", "continue"])

  mockFontScale = 3.571
  await view.rerender(<Row />)
  expect(order()).toEqual(["continue", "back"])
  expect(screen.getByTestId("continue")).toBe(continueButton)

  await fireEvent.press(screen.getByTestId("continue"))
  await fireEvent.press(screen.getByTestId("back"))
  expect(onContinue).toHaveBeenCalledTimes(1)
  expect(onBack).toHaveBeenCalledTimes(1)
})

it("merges the caller style last", async () => {
  await render(<Row style={{ marginTop: 12 }} />)
  expect(flat("row")).toMatchObject({ flexDirection: "row", marginTop: 12 })
})
