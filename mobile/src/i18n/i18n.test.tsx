import { render } from "@testing-library/react-native"
import { useTranslation } from "react-i18next"
import { Text } from "react-native"

import en from "./locales/en.json"
import fr from "./locales/fr.json"

// Renders through the real i18next instance (initialized by jest/setup-i18n).
// A localized component calls t() for a known key under the default (en)
// locale; the assertion proves init + t() + catalog resolve end to end (the
// default instance, no provider) — the wiring is real, not just present (D8).
function Probe() {
  const { t } = useTranslation()
  return <Text>{t("home.tab.label")}</Text>
}

describe("i18n wiring", () => {
  it("renders a translated string, not the raw key", async () => {
    const { findByText, queryByText } = await render(<Probe />)

    expect(await findByText("Home")).toBeTruthy()
    expect(queryByText("home.tab.label")).toBeNull()
  })

  it("keeps English and French chooser catalog keys in parity", () => {
    expect(Object.keys(fr)).toEqual(Object.keys(en))
    expect(en).toMatchObject({
      "calendar.event.chooser.title": "Choose an event",
      "calendar.event.chooser.trigger": "Choose an overlapping event",
      "calendar.event.chooser.cancel": "Cancel",
    })
    expect(fr).toMatchObject({
      "calendar.event.chooser.title": "Choisir un événement",
      "calendar.event.chooser.trigger": "Choisir un événement superposé",
      "calendar.event.chooser.cancel": "Annuler",
    })
  })
})
