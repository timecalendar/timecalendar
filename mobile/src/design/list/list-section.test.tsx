import { render } from "@testing-library/react-native"
import { StyleSheet, type TextStyle } from "react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors, ListGeometry } from "@/theme"

import { ListRow } from "./list-row"
import { ListSection } from "./list-section"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}))

function flat(element: { props: { style?: unknown } }): TextStyle {
  return StyleSheet.flatten(element.props.style as TextStyle) ?? {}
}

const container = (view: Awaited<ReturnType<typeof render>>, id: string) =>
  flat(view.getByTestId(id).parent!)

describe.each(["ios", "android"] as const)("ListSection on %s", (platform) => {
  usePlatform(platform)
  const ios = platform === "ios"

  it.each([
    [1, ["single"]],
    [2, ["first", "last"]],
    [3, ["first", "middle", "last"]],
  ] as const)(
    "positions %d rows and skips null children",
    async (count, positions) => {
      const view = await render(
        <ListSection testID="section">
          {null}
          {positions
            .map((_, index) => `row-${index}`)
            .map((id) => (
              <ListRow key={id} label={id} onPress={jest.fn()} testID={id} />
            ))}
          {false}
        </ListSection>,
      )
      positions.forEach((position, index) => {
        const style = container(view, `row-${index}`)
        const opensTop = position === "first" || position === "single"
        const closesBottom = position === "last" || position === "single"
        if (ios) {
          expect(style.borderTopLeftRadius === 0).toBe(!opensTop)
          expect(style.borderBottomLeftRadius === 0).toBe(!closesBottom)
        } else {
          const { outerRadius, innerRadius, segmentGap } = ListGeometry.android
          expect(style.borderTopLeftRadius).toBe(
            opensTop ? outerRadius : innerRadius,
          )
          expect(style.borderBottomLeftRadius).toBe(
            closesBottom ? outerRadius : innerRadius,
          )
          expect(style.marginBottom).toBe(closesBottom ? 0 : segmentGap)
        }
      })
      expect(count).toBe(positions.length)
    },
  )

  it("lets the section's position win over a row's own", async () => {
    const view = await render(
      <ListSection>
        <ListRow
          label="Only"
          position="middle"
          onPress={jest.fn()}
          testID="row"
        />
      </ListSection>,
    )
    const style = container(view, "row")
    expect(style.borderTopLeftRadius).not.toBe(0)
    expect(style.borderBottomLeftRadius).not.toBe(0)
    expect(style.borderTopLeftRadius).not.toBe(ListGeometry.android.innerRadius)
  })

  it("titles the section with a header and adds a footer", async () => {
    const view = await render(
      <ListSection testID="section" title="Title" footer="Footer">
        <ListRow label="Row" onPress={jest.fn()} testID="row" />
      </ListSection>,
    )
    const title = view.getByRole("header", { name: "Title" })
    expect(title.props.testID).toBe("section-title")
    expect(title.props.numberOfLines).toBeGreaterThan(0)
    expect(flat(title).color).toBe(
      ios ? Colors.light.textSecondary : Colors.light.actionText,
    )
    expect(flat(title).paddingHorizontal).toBe(
      ListGeometry.rowPaddingHorizontal,
    )
    const footer = view.getByTestId("section-footer")
    expect(footer.props.numberOfLines).toBeGreaterThan(0)
    expect(flat(footer).color).toBe(Colors.light.textSecondary)
  })

  it("renders no title or footer when none is given", async () => {
    const view = await render(
      <ListSection testID="section">
        <ListRow label="Row" onPress={jest.fn()} testID="row" />
      </ListSection>,
    )
    expect(view.queryByRole("header")).toBeNull()
    expect(view.queryByTestId("section-footer")).toBeNull()
    expect(flat(view.getByTestId("section")).marginHorizontal).toBeUndefined()
  })

  it("titles without a testID", async () => {
    const view = await render(
      <ListSection title="Title" footer="Footer">
        <ListRow label="Row" onPress={jest.fn()} testID="row" />
      </ListSection>,
    )
    expect(view.getByRole("header").props.testID).toBeUndefined()
    expect(view.getByText("Footer").props.testID).toBeUndefined()
  })
})
