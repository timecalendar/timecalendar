import i18n from "@/i18n"
import { renderStory } from "@/test-support/gallery"

import * as fixture from "./tokens.gallery"

afterEach(async () => {
  await i18n.changeLanguage("en")
})

it.each([
  ["en", /^\d+\.\d{2}:1, floor \d(\.\d)?:1/],
  ["fr", /^\d+,\d{2}:1, seuil \d(,\d)?:1/],
])("formats contrast ratios in %s", async (language, detail) => {
  await i18n.changeLanguage(language)
  const view = await renderStory(fixture.ContrastPairs)
  const details = view.getAllByText(/:1, /)
  expect(details.length).toBeGreaterThan(0)
  for (const node of details) expect(node).toHaveTextContent(detail)
})
