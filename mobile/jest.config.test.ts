import type { Config } from "jest"

import jestConfig from "./jest.config"

// TIM-273 / ADR 044. The harness mounts real React Native trees under coverage
// instrumentation, and RN/Expo host components register lazily on first render
// — so the test that first mounts a heavy tree is billed the whole one-time
// cost (measured ~4.1 s idle, 9.5 s+ under CPU contention, on a suite whose
// other tests report 4-600 ms). Jest's 5 000 ms default left the baseline gate
// passing at ~83 % of budget on a canary test; every CI run is cold-cache.
//
// The floor is what this guards: a later edit cannot silently delete the key
// or drift it back toward the default and re-open the intermittent. It is NOT
// a licence to raise query waits — the budget bounds execution time, never how
// long an assertion may search for an element.
const FLOOR_MS = 20000

describe("Jest harness configuration", () => {
  it("sets an explicit per-test time budget at or above the TIM-273 floor", () => {
    const { testTimeout } = jestConfig as Config

    expect(testTimeout).toBeDefined()
    expect(testTimeout).toBeGreaterThanOrEqual(FLOOR_MS)
  })
})
