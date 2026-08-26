import { getNumber, setNumber } from "@/storage"

import {
  CHANGELOG_SEEN_VERSION_KEY,
  getChangelogSeenVersion,
  setChangelogSeenVersion,
} from "./seen-version"

jest.mock("@/storage", () => ({ getNumber: jest.fn(), setNumber: jest.fn() }))

const mockGetNumber = getNumber as jest.Mock
const mockSetNumber = setNumber as jest.Mock

beforeEach(() => jest.clearAllMocks())

describe("changelog seen-version store", () => {
  it.each([
    [undefined, undefined],
    [-1, undefined],
    [1.5, undefined],
    [Number.NaN, undefined],
    [Number.POSITIVE_INFINITY, undefined],
    [Number.MAX_SAFE_INTEGER + 1, undefined],
    [3, 3],
    [4, 4],
    [5, 5],
  ])("total-decodes %p as %p", (stored, expected) => {
    mockGetNumber.mockReturnValue(stored)
    expect(getChangelogSeenVersion()).toBe(expected)
    expect(mockGetNumber).toHaveBeenCalledWith(CHANGELOG_SEEN_VERSION_KEY)
  })

  it("treats malformed and throwing backend reads as absent", () => {
    mockGetNumber.mockReturnValueOnce("3").mockImplementationOnce(() => {
      throw new Error("corrupt backend")
    })
    expect(getChangelogSeenVersion()).toBeUndefined()
    expect(getChangelogSeenVersion()).toBeUndefined()
  })

  it("exports the Phase 09 setter through the flat MMKV key", () => {
    setChangelogSeenVersion(3)
    expect(mockSetNumber).toHaveBeenCalledWith(CHANGELOG_SEEN_VERSION_KEY, 3)
  })
})
