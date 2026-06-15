import { randomUUID } from "expo-crypto"

import { newId } from "./id"

// expo-crypto has no off-device JS; mock it. Proves the wrapper is the single
// delegation point to randomUUID (D7).
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(),
}))

const mockRandomUUID = randomUUID as jest.MockedFunction<typeof randomUUID>

describe("newId", () => {
  it("returns the value from expo-crypto randomUUID", () => {
    mockRandomUUID.mockReturnValue("22222222-2222-4222-8222-222222222222")
    expect(newId()).toBe("22222222-2222-4222-8222-222222222222")
    expect(mockRandomUUID).toHaveBeenCalledTimes(1)
  })
})
