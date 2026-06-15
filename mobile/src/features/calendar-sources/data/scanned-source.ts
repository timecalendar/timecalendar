import { useSyncExternalStore } from "react"

import type { ScannedCalendarSource } from "./types"

// The EPHEMERAL in-memory handoff for the parsed scanned source (design D7).
// This is deliberately NOT MMKV and NOT Drizzle: durable `user_calendars` token
// persistence is ship 5 (the Phase 09 migration target). This module-scoped
// holder is the seam ship 5 SWAPS for the durable store — it demonstrates
// camera → state end-to-end without pre-empting that ship's schema decision.
// A reactive store (useSyncExternalStore) so a consumer re-renders on a scan,
// mirroring the reactive-read posture of the durable stores it stands in for.

let current: ScannedCalendarSource | null = null
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

/** Stash the parsed source (the successful-scan handoff). */
export function setScannedSource(source: ScannedCalendarSource): void {
  current = source
  emit()
}

/** Clear the held source (e.g. after the consumer has taken it). */
export function clearScannedSource(): void {
  current = null
  emit()
}

/** Read the held source imperatively (non-reactive). */
export function getScannedSource(): ScannedCalendarSource | null {
  return current
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Reactive read of the held source — re-renders when a scan lands. */
export function useScannedSource(): ScannedCalendarSource | null {
  return useSyncExternalStore(subscribe, getScannedSource, getScannedSource)
}
