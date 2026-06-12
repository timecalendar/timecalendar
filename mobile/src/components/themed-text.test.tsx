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
})
