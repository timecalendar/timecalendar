import { createContext } from "react"

export type ListRowPosition = "first" | "middle" | "last" | "single"

export const ListRowPositionContext = createContext<ListRowPosition | null>(
  null,
)

export function listRowPosition(index: number, count: number): ListRowPosition {
  if (count === 1) return "single"
  if (index === 0) return "first"
  return index === count - 1 ? "last" : "middle"
}
