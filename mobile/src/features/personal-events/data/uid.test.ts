import { randomUUID } from "expo-crypto"

import { newEventId } from "./uid"

// expo-crypto has no off-device JS; mock it. Proves the wrapper is the single
// delegation point to randomUUID (D2).
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(),
}))

const mockRandomUUID = randomUUID as jest.MockedFunction<typeof randomUUID>

describe("newEventId", () => {
  it("returns the value from expo-crypto randomUUID", () => {
    mockRandomUUID.mockReturnValue("11111111-1111-4111-8111-111111111111")
    expect(newEventId()).toBe("11111111-1111-4111-8111-111111111111")
    expect(mockRandomUUID).toHaveBeenCalledTimes(1)
  })
})
