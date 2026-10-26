import { ListGeometry } from "@/theme"

export type SeparatorInset = "none" | "leading" | { leadingWidth: number }

export function separatorInset(inset: SeparatorInset | undefined): number {
  if (inset === undefined || inset === "none") return 0
  if (inset === "leading") return ListGeometry.rowPaddingHorizontal
  return (
    ListGeometry.rowPaddingHorizontal +
    inset.leadingWidth +
    ListGeometry.leadingGap
  )
}
