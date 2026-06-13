import { render } from "@testing-library/react-native"

import { ThemedText } from "@/components/themed-text"

// Smoke test: proves the jest-expo harness transforms RN/Expo modules and that
// React Native Testing Library can render and query a real component.
describe("ThemedText", () => {
  it("renders its children as text", async () => {
    const { getByText } = await render(
      <ThemedText>Hello from the harness</ThemedText>,
    )

    expect(getByText("Hello from the harness")).toBeTruthy()
  })

  // a11y proof: assert an accessibility *role* resolves in the rendered tree
  // (the layer lint can't see), not merely that a prop was passed.
  it("exposes title/subtitle variants as headings", async () => {
    const title = await render(<ThemedText type="title">Title</ThemedText>)
    expect(title.getByRole("header")).toBeTruthy()

    const subtitle = await render(
      <ThemedText type="subtitle">Subtitle</ThemedText>,
    )
    expect(subtitle.getByRole("header")).toBeTruthy()
  })

  it("does not expose the default variant as a heading", async () => {
    const { queryByRole } = await render(<ThemedText>Body</ThemedText>)

    expect(queryByRole("header")).toBeNull()
  })

  it("lets a caller-supplied accessibilityRole win over the header default", async () => {
    const { getByRole, queryByRole } = await render(
      <ThemedText type="title" accessibilityRole="summary">
        Title
      </ThemedText>,
    )

    expect(getByRole("summary")).toBeTruthy()
    expect(queryByRole("header")).toBeNull()
  })
})
