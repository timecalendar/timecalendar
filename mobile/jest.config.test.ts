import jestConfig from "./jest.config"

// TIM-273 / ADR 044. The CI half of the per-test budget rule: a later edit
// cannot silently delete `testTimeout` or drift it back toward Jest's 5 000 ms
// default and re-open the intermittent. The mechanism and the measurements
// behind the number live on the key itself, in jest.config.js.
//
// The floor sits below the shipped value so tuning stays free — only a return
// toward the default trips it. It is not a licence to raise query waits: the
// budget bounds execution time, never how long an assertion may search.
const FLOOR_MS = 20000

describe("Jest harness configuration", () => {
  it("sets an explicit per-test time budget at or above the TIM-273 floor", () => {
    expect(jestConfig.testTimeout).toBeDefined()
    expect(jestConfig.testTimeout).toBeGreaterThanOrEqual(FLOOR_MS)
  })
})
