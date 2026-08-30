import { StyleSheet } from "react-native"

import { MaxContentWidth, Radii, Spacing } from "@/theme"

// The shared frame of the import-journey steps (TIM-391): institution name →
// programme → Connect → manual import are one visual family — a centred
// max-width column, a title/helper intro, and 48pt-minimum full-width controls.
//
// It lives in one place because the same StyleSheet block written four times
// stops being a family on the first tweak: the four screens are seen back to
// back in a single sitting, so a padding that drifts on one of them reads as a
// layout bug rather than as a variation.
//
// Screen-specific deltas compose on top (`[stepStyles.intro, styles.intro]`);
// only the parts that are identical across the steps live here. A control whose
// shape is genuinely local — Connect's Back/Continue footer pair, the
// manual-import QR/link pair — keeps its own style next to its sibling, where
// the primary/secondary distinction is the thing worth reading.
export const stepStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    justifyContent: "center",
    gap: Spacing.three,
  },
  intro: {
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
  // The single full-width primary action a name step ends with.
  cta: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: Radii.medium,
  },
})
