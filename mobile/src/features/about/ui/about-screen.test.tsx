import { fireEvent, render } from "@testing-library/react-native"
import * as Linking from "expo-linking"
import * as WebBrowser from "expo-web-browser"

import { readApplicationInfo } from "@/features/about/data"
import i18n from "@/i18n"

import { AboutScreen } from "./about-screen"

jest.mock("@/features/about/data", () => ({
  readApplicationInfo: jest.fn(),
}))

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: { Screen: () => null },
}))

jest.mock("expo-symbols", () => ({ SymbolView: () => null }))
jest.mock("expo-linking", () => ({ openURL: jest.fn() }))
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }))

const mockReadApplicationInfo = readApplicationInfo as jest.Mock
const mockOpenURL = Linking.openURL as jest.Mock
const mockOpenBrowser = WebBrowser.openBrowserAsync as jest.Mock

beforeEach(async () => {
  jest.clearAllMocks()
  mockReadApplicationInfo.mockReturnValue({
    kind: "versionAndBuild",
    version: "4.0.0",
    build: "135",
  })
  await i18n.changeLanguage("en")
})

describe("AboutScreen", () => {
  it("renders English content in stable native groups without deferred rows", async () => {
    const view = await render(<AboutScreen />)

    expect(
      view.getByText(
        "With TimeCalendar, easily access your university schedule.",
      ),
    ).toBeTruthy()
    expect(view.getByText("Privacy policy")).toBeTruthy()
    expect(view.getByText("Email us")).toBeTruthy()
    expect(view.getByText("Version 4.0.0 · Build 135")).toBeTruthy()
    expect(view.getByText("Samuel Prak")).toBeTruthy()
    expect(view.getByText("Eddy Monnot")).toBeTruthy()
    expect(view.queryByText(/suggestions/i)).toBeNull()
    expect(view.queryByText(/debug/i)).toBeNull()
    expect(view.queryByText(/changelog/i)).toBeNull()

    const sectionIds = ["privacy", "contact", "app", "developers"]
    expect(
      view
        .getAllByTestId(/^about-section-/)
        .map((section) => section.props.testID),
    ).toEqual(sectionIds.map((id) => `about-section-${id}`))
    for (const id of sectionIds) {
      expect(view.getByTestId(`about-section-${id}`)).toBeOnTheScreen()
    }
  })

  it("renders the complete French catalog without key fallbacks", async () => {
    await i18n.changeLanguage("fr")
    const view = await render(<AboutScreen />)

    expect(
      view.getByText(
        "Avec TimeCalendar, accédez facilement à votre emploi du temps universitaire.",
      ),
    ).toBeTruthy()
    expect(view.getByText("Politique de confidentialité")).toBeTruthy()
    expect(view.getByText("Nous écrire")).toBeTruthy()
    expect(view.getByText("Informations sur l’application")).toBeTruthy()
    expect(view.getByText("Développeurs")).toBeTruthy()
  })

  it("dispatches browser and mail actions through their native seams", async () => {
    const view = await render(<AboutScreen />)

    await fireEvent.press(view.getByTestId("about-privacy"))
    await fireEvent.press(view.getByTestId("about-contact"))
    await fireEvent.press(view.getByTestId("about-developer-samuel"))
    await fireEvent.press(view.getByTestId("about-developer-eddy"))

    expect(mockOpenURL).toHaveBeenCalledWith("mailto:hello@timecalendar.app")
    expect(mockOpenBrowser.mock.calls).toEqual([
      ["https://timecalendar.app/privacy-policy"],
      ["https://www.samuelprak.fr/"],
      ["https://www.eddymonnot.com/"],
    ])
  })

  it.each([
    [{ kind: "versionOnly", version: "4.0.0" }, "Version 4.0.0"],
    [{ kind: "buildOnly", build: "135" }, "Build 135"],
    [{ kind: "unavailable" }, "Unavailable"],
  ])("presents the %s metadata case truthfully", async (info, expected) => {
    mockReadApplicationInfo.mockReturnValue(info)
    const view = await render(<AboutScreen />)

    const row = view.getByTestId("about-version")
    expect(view.getByText(expected)).toBeTruthy()
    expect(row.props.accessibilityRole).toBeUndefined()
    expect(row.props.accessibilityHint).toBeUndefined()
    expect(row.props.onPress).toBeUndefined()
    expect(row.props.accessibilityValue).toEqual({ text: expected })
  })

  it("exposes one full-width accessible link for each outbound row", async () => {
    const view = await render(<AboutScreen />)

    for (const testID of [
      "about-privacy",
      "about-contact",
      "about-developer-samuel",
      "about-developer-eddy",
    ]) {
      const row = view.getByTestId(testID)
      expect(row.props.accessibilityRole).toBe("link")
      expect(row.props.accessibilityHint).toBeTruthy()
      expect(row).toHaveStyle({ flexDirection: "row", alignItems: "center" })
    }
  })
})
