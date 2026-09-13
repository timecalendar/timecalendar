import {
  createGestureDecision,
  terminateGestureDecision,
  updateGestureDecision,
} from "./gesture-state"

describe("gesture decision", () => {
  it("waits within tap tolerance and near the diagonal", () => {
    const initial = createGestureDecision(4)
    expect(updateGestureDecision(initial, 8, 4, 4)).toBe(initial)
    expect(updateGestureDecision(initial, 20, 19, 4)).toEqual({
      ...initial,
      pressEligible: false,
    })
  })

  it.each([
    [30, 4, "horizontal"],
    [4, -30, "vertical"],
  ] as const)("locks %s/%s to %s", (x, y, axis) => {
    expect(
      updateGestureDecision(createGestureDecision(1), x, y, 1),
    ).toMatchObject({
      axis,
      pressEligible: false,
    })
  })

  it("keeps the selected axis immutable through reversal", () => {
    const locked = updateGestureDecision(createGestureDecision(1), 30, 2, 1)
    expect(updateGestureDecision(locked, 2, -100, 1)).toBe(locked)
  })

  it("makes cancellation terminal and rejects stale epochs", () => {
    const initial = createGestureDecision(2)
    const terminal = terminateGestureDecision(initial, 2)
    expect(terminal.terminal).toBe(true)
    expect(updateGestureDecision(terminal, 100, 0, 2)).toBe(terminal)
    expect(updateGestureDecision(initial, 100, 0, 3)).toBe(initial)
    expect(terminateGestureDecision(initial, 3)).toBe(initial)
  })
})
