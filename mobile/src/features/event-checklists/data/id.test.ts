import { randomUUID } from "expo-crypto"

import { newId } from "./id"

// expo-crypto has no off-device JS; mock it. Proves the wrapper is the single
// delegation point to randomUUID (ADR 024) — the importer bypasses it.
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(),
}))

const mockRandomUUID = randomUUID as jest.MockedFunction<typeof randomUUID>

describe("newId", () => {
  it("returns the value from expo-crypto randomUUID", () => {
    mockRandomUUID.mockReturnValue("33333333-3333-4333-8333-333333333333")
    expect(newId()).toBe("33333333-3333-4333-8333-333333333333")
    expect(mockRandomUUID).toHaveBeenCalledTimes(1)
  })
})
