import { render } from "@testing-library/react-native"

import { WriteErrorNotice } from "./write-error-notice"

describe("WriteErrorNotice", () => {
  it("renders the message as a polite alert live region", async () => {
    const { getByText } = await render(
      <WriteErrorNotice message="Save failed" />,
    )

    const node = getByText("Save failed")
    expect(node.props.accessibilityRole).toBe("alert")
    expect(node.props.accessibilityLiveRegion).toBe("polite")
  })
})
