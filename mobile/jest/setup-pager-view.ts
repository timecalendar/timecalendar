// react-native-pager-view is a native-only UIPageViewController / ViewPager2
// bridge. Keep one suite-wide mock at that native seam so component tests render
// real pager children and exercise the same onPageSelected state transition as a
// swipe or imperative page change on-device.
jest.mock("react-native-pager-view", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native")

  let onPageSelected:
    | ((event: { nativeEvent: { position: number } }) => void)
    | undefined

  const setPage = jest.fn((position: number) => {
    onPageSelected?.({ nativeEvent: { position } })
  })
  const setPageWithoutAnimation = jest.fn((position: number) => {
    onPageSelected?.({ nativeEvent: { position } })
  })

  const PagerView = React.forwardRef(function PagerView(
    props: {
      children?: unknown
      onPageSelected?: (event: { nativeEvent: { position: number } }) => void
      testID?: string
    },
    ref: unknown,
  ) {
    onPageSelected = props.onPageSelected
    React.useImperativeHandle(ref, () => ({
      setPage,
      setPageWithoutAnimation,
    }))

    return React.createElement(
      View,
      {
        testID: props.testID,
        onPageSelected: props.onPageSelected,
      },
      props.children,
    )
  })

  return {
    __esModule: true,
    default: PagerView,
    __pagerMock: { setPage, setPageWithoutAnimation },
  }
})
