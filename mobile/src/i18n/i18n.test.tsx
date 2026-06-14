import { render } from "@testing-library/react-native"
import { useTranslation } from "react-i18next"
import { Text } from "react-native"

// Renders through the real i18next instance (initialized by jest/setup-i18n).
// A localized component calls t() for a known key under the default (en)
// locale; the assertion proves init + t() + catalog resolve end to end (the
// default instance, no provider) — the wiring is real, not just present (D8).
function Probe() {
  const { t } = useTranslation()
  return <Text>{t("home.title")}</Text>
}

describe("i18n wiring", () => {
  it("renders a translated string, not the raw key", async () => {
    const { findByText, queryByText } = await render(<Probe />)

    expect(await findByText("Home")).toBeTruthy()
    expect(queryByText("home.title")).toBeNull()
  })
})
