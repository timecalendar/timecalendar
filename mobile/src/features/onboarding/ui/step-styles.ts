import { StyleSheet } from "react-native"

import { Radii, Spacing } from "@/theme"

// The shared frame of the import-journey steps (TIM-391): institution name →
// programme → Connect → manual import are one visual family — a centred
// max-width column, a title/helper intro, and full-width controls.
//
// It lives in one place because the same StyleSheet block written four times
// stops being a family on the first tweak: the four screens are seen back to
// back in a single sitting, so a padding that drifts on one of them reads as a
// layout bug rather than as a variation.
//
// Only the parts that are identical across the steps live here; the buttons
// themselves are the shared `Button` (ADR 067).
export const stepStyles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.three,
  },
  formContent: {
    flexGrow: 1,
    justifyContent: "center",
    gap: Spacing.three,
  },
  // The free-text name field shared by the two name steps. Their VALIDATION
  // rules are deliberately different (institution required, programme optional
  // via Skip) — only the box is shared.
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radii.medium,
    fontSize: 16,
  },
})
