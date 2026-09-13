// react-native-pager-view is a native-only UIPageViewController / ViewPager2
// bridge. Keep one suite-wide mock at that native seam so component tests render
// real pager children and exercise the same onPageSelected state transition as a
// swipe or imperative page change on-device.
jest.mock("react-native-pager-view", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native")

  const setPage = jest.fn()
  const setPageWithoutAnimation = jest.fn()
  let deferNextTransition = false

  const PagerView = React.forwardRef(function PagerView(
    props: {
      children?: unknown
      onPageSelected?: (event: { nativeEvent: { position: number } }) => void
      onPageScrollStateChanged?: (event: {
        nativeEvent: { pageScrollState: "idle" | "dragging" | "settling" }
      }) => void
      testID?: string
      initialPage?: number
      offscreenPageLimit?: number
      overdrag?: boolean
      accessible?: boolean
      accessibilityElementsHidden?: boolean
      importantForAccessibility?: string
    },
    ref: unknown,
  ) {
    const emitPage = (position: number, animated: boolean) => {
      const observer = animated ? setPage : setPageWithoutAnimation
      observer(position)
      if (deferNextTransition) {
        deferNextTransition = false
        return
      }
      if (animated) {
        props.onPageScrollStateChanged?.({
          nativeEvent: { pageScrollState: "settling" },
        })
      }
      props.onPageSelected?.({ nativeEvent: { position } })
      props.onPageScrollStateChanged?.({
        nativeEvent: { pageScrollState: "idle" },
      })
    }
    React.useImperativeHandle(ref, () => ({
      setPage: (position: number) => emitPage(position, true),
      setPageWithoutAnimation: (position: number) => emitPage(position, false),
    }))

    return React.createElement(
      View,
      {
        testID: props.testID,
        onPageSelected: props.onPageSelected,
        onPageScrollStateChanged: props.onPageScrollStateChanged,
        initialPage: props.initialPage,
        offscreenPageLimit: props.offscreenPageLimit,
        overdrag: props.overdrag,
        accessible: props.accessible,
        accessibilityElementsHidden: props.accessibilityElementsHidden,
        importantForAccessibility: props.importantForAccessibility,
      },
      props.children,
    )
  })

  return {
    __esModule: true,
    default: PagerView,
    __pagerMock: {
      setPage,
      setPageWithoutAnimation,
      deferNextTransition: () => {
        deferNextTransition = true
      },
    },
  }
})
