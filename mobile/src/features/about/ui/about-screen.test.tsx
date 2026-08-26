import { act, fireEvent, render, waitFor } from "@testing-library/react-native"
import * as Linking from "expo-linking"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"

import { readApplicationInfo } from "@/features/about/data"
import { recordUnknownError } from "@/firebase"
import i18n from "@/i18n"

import { AboutScreen } from "./about-screen"

jest.mock("@/features/about/data", () => ({
  readApplicationInfo: jest.fn(),
}))
jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: { Screen: () => null },
}))

jest.mock("expo-symbols", () => ({ SymbolView: () => null }))
jest.mock("expo-linking", () => ({ openURL: jest.fn() }))
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }))

const mockReadApplicationInfo = readApplicationInfo as jest.Mock
const mockRecordUnknownError = recordUnknownError as jest.Mock
const mockOpenURL = Linking.openURL as jest.Mock
const mockOpenBrowser = WebBrowser.openBrowserAsync as jest.Mock
const mockPush = router.push as jest.Mock

beforeEach(async () => {
  jest.clearAllMocks()
  mockReadApplicationInfo.mockReturnValue({
    kind: "versionAndBuild",
    version: "4.0.0",
    build: "135",
  })
  mockOpenURL.mockResolvedValue(undefined)
  mockOpenBrowser.mockResolvedValue(undefined)
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
    expect(view.getByText("What’s new")).toBeTruthy()

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
    expect(view.getByText("Nouveautés")).toBeTruthy()
  })

  it("opens Changelog history through one full-width localized link", async () => {
    const view = await render(<AboutScreen />)
    const row = view.getByTestId("about-changelog")
    expect(row.props.accessibilityRole).toBe("link")
    expect(row.props.accessibilityHint).toBe("Opens the full release history")
    await fireEvent.press(row)
    expect(mockPush).toHaveBeenCalledWith("/changelog")
    expect(
      view
        .getAllByTestId(/^about-section-/)
        .map((section) => section.props.testID),
    ).toEqual([
      "about-section-privacy",
      "about-section-contact",
      "about-section-app",
      "about-section-developers",
    ])
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

  it("records a rejected browser action and shows recoverable feedback", async () => {
    const error = new Error("browser unavailable")
    mockOpenBrowser.mockRejectedValueOnce(error)
    const view = await render(<AboutScreen />)

    await act(async () => {
      fireEvent.press(view.getByTestId("about-privacy"))
    })

    await waitFor(() => {
      expect(mockRecordUnknownError).toHaveBeenCalledWith(
        error,
        "about/open-privacy",
      )
      expect(
        view.getByText("We couldn’t open this link. Please try again."),
      ).toBeTruthy()
    })
  })

  it("records a rejected mail action and localizes recoverable feedback", async () => {
    await i18n.changeLanguage("fr")
    const error = new Error("mail unavailable")
    mockOpenURL.mockRejectedValueOnce(error)
    const view = await render(<AboutScreen />)

    await act(async () => {
      fireEvent.press(view.getByTestId("about-contact"))
    })

    await waitFor(() => {
      expect(mockRecordUnknownError).toHaveBeenCalledWith(
        error,
        "about/open-contact",
      )
      expect(
        view.getByText("Impossible d’ouvrir ce lien. Veuillez réessayer."),
      ).toBeTruthy()
    })
  })

  it("includes the bottom safe-area edge for the root destination", async () => {
    const view = await render(<AboutScreen />)

    expect(view.getByTestId("about-safe-area").props.edges).toEqual({
      top: "off",
      left: "additive",
      right: "additive",
      bottom: "additive",
    })
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
      "about-changelog",
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
