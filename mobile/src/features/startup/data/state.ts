import { useSyncExternalStore } from "react"

import type { LaunchDestination } from "./resolver"

export type LaunchState =
  | { kind: "resolving"; attempt: number }
  | { kind: "navigating"; attempt: number; target: LaunchDestination }
  | { kind: "committed"; attempt: number; target: LaunchDestination }
  | { kind: "failure"; attempt: number; error: Error }

let state: LaunchState = { kind: "resolving", attempt: 0 }
const listeners = new Set<() => void>()

function publish(next: LaunchState): void {
  state = next
  for (const listener of listeners) listener()
}

export function getLaunchState(): LaunchState {
  return state
}

export function beginLaunchNavigation(target: LaunchDestination): void {
  publish({ kind: "navigating", attempt: state.attempt, target })
}

export function commitLaunch(target: LaunchDestination): void {
  publish({ kind: "committed", attempt: state.attempt, target })
}

export function failLaunch(error: unknown): void {
  const normalized = error instanceof Error ? error : new Error(String(error))
  publish({ kind: "failure", attempt: state.attempt, error: normalized })
}

export function retryLaunch(): void {
  publish({ kind: "resolving", attempt: state.attempt + 1 })
}

export function useLaunchState(): LaunchState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getLaunchState,
    getLaunchState,
  )
}

export function useLaunchCommitted(): boolean {
  return useLaunchState().kind === "committed"
}

export function resetLaunchStateForTests(): void {
  state = { kind: "resolving", attempt: 0 }
}
