// Scroll props paired with RootPage's `scrollsUnderHeader`: a page with content
// insets under the header and bounces; an empty/error state is laid out below
// the header by RootPage and scrolls only when it overflows.
export function headerScrollProps(scrollsUnderHeader: boolean) {
  return {
    contentInsetAdjustmentBehavior: scrollsUnderHeader ? "automatic" : "never",
    alwaysBounceVertical: scrollsUnderHeader,
  } as const
}
