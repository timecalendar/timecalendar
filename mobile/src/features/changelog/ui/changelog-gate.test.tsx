import { render, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import {
  getChangelogSeenVersion,
  setChangelogSeenVersion,
} from "@/features/changelog/store"

import { ChangelogGate } from "./changelog-gate"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))
jest.mock("@/features/changelog/store", () => {
  const actual = jest.requireActual("@/features/changelog/store")
  return {
    ...actual,
    getChangelogSeenVersion: jest.fn(),
    setChangelogSeenVersion: jest.fn(),
  }
})

const mockGetSeen = getChangelogSeenVersion as jest.Mock
const mockSetSeen = setChangelogSeenVersion as jest.Mock
const mockPush = router.push as jest.Mock

beforeEach(() => jest.clearAllMocks())

describe("ChangelogGate", () => {
  it("silently seeds a fresh or corrupt install", async () => {
    mockGetSeen.mockReturnValue(undefined)
    await render(<ChangelogGate />)
    await waitFor(() => expect(mockSetSeen).toHaveBeenCalledWith(4))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("pushes once for a migrated version across rerenders", async () => {
    mockGetSeen.mockReturnValue(3)
    const view = await render(<ChangelogGate />)
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/changelog-sheet"),
    )
    view.rerender(<ChangelogGate />)
    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockSetSeen).not.toHaveBeenCalled()
  })

  it.each([4, 5])("skips current and future version %d", async (version) => {
    mockGetSeen.mockReturnValue(version)
    await render(<ChangelogGate />)
    await waitFor(() => expect(mockGetSeen).toHaveBeenCalledTimes(1))
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockSetSeen).not.toHaveBeenCalled()
  })
})
