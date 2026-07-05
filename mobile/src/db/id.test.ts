import { randomUUID } from "expo-crypto"

import { newId } from "./id"

// expo-crypto has no off-device JS; mock it. Proves the seam is the single
// delegation point to randomUUID — this one test folds the three near-identical
// per-feature wrapper tests it replaces.
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(),
}))

const mockRandomUUID = randomUUID as jest.MockedFunction<typeof randomUUID>

describe("newId", () => {
  it("returns the value from expo-crypto randomUUID", () => {
    mockRandomUUID.mockReturnValue("11111111-1111-4111-8111-111111111111")
    expect(newId()).toBe("11111111-1111-4111-8111-111111111111")
    expect(mockRandomUUID).toHaveBeenCalledTimes(1)
  })
})
