export type GestureAxis = "undecided" | "horizontal" | "vertical"

export type GestureDecision = {
  axis: GestureAxis
  pressEligible: boolean
  terminal: boolean
  epoch: number
}

export function createGestureDecision(epoch: number): GestureDecision {
  "worklet"
  return { axis: "undecided", pressEligible: true, terminal: false, epoch }
}

export function updateGestureDecision(
  state: GestureDecision,
  translationX: number,
  translationY: number,
  epoch: number,
  tapTolerance = 10,
  dominanceRatio = 1.25,
): GestureDecision {
  "worklet"
  if (state.terminal || state.epoch !== epoch || state.axis !== "undecided")
    return state
  const horizontal = Math.abs(translationX)
  const vertical = Math.abs(translationY)
  if (Math.max(horizontal, vertical) <= tapTolerance) return state
  const axis =
    horizontal > vertical * dominanceRatio
      ? "horizontal"
      : vertical > horizontal * dominanceRatio
        ? "vertical"
        : "undecided"
  return { ...state, axis, pressEligible: false }
}

export function terminateGestureDecision(
  state: GestureDecision,
  epoch: number,
): GestureDecision {
  "worklet"
  return state.epoch === epoch ? { ...state, terminal: true } : state
}
