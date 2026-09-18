const { RuleTester } = require("eslint")

const rule = require("./no-js-call-in-worklet")

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
})

const options = [
  {
    safeImports: {
      "@/grid": ["minuteToPixel"],
      "react-native-reanimated": true,
    },
  },
]

ruleTester.run("no-js-call-in-worklet", rule, {
  valid: [
    {
      code: `
        import { minuteToPixel } from "@/grid"
        const style = useAnimatedStyle(() => ({ top: minuteToPixel(60) }))
      `,
      options,
    },
    {
      code: `
        import { withTiming } from "react-native-reanimated"
        const gesture = Gesture.Pan().onUpdate(() => { withTiming(1) })
      `,
      options,
    },
    {
      // A local helper carrying the directive is callable from a worklet.
      code: `
        function height(scale) { "worklet"; return scale * 24 }
        const style = useAnimatedStyle(() => ({ height: height(60) }))
      `,
      options,
    },
    {
      // Off the UI thread, a plain JS call is exactly right.
      code: `
        import { formatHour } from "@/grid"
        function label() { return formatHour(9) }
      `,
      options,
    },
    {
      // Members and unresolved globals are out of scope (SharedValue.get(), Math.max()).
      code: `
        const style = useAnimatedStyle(() => ({ top: Math.max(scale.get(), 0) }))
      `,
      options,
    },
  ],
  invalid: [
    {
      code: `
        import { formatHour } from "@/grid"
        const style = useAnimatedStyle(() => ({ top: formatHour(9) }))
      `,
      options,
      errors: [{ messageId: "unsafeImport" }],
    },
    {
      code: `
        import { minuteToPixel } from "@/other-module"
        const style = useAnimatedStyle(() => ({ top: minuteToPixel(60) }))
      `,
      options,
      errors: [{ messageId: "unsafeImport" }],
    },
    {
      code: `
        function height(scale) { return scale * 24 }
        const style = useAnimatedStyle(() => ({ height: height(60) }))
      `,
      options,
      errors: [{ messageId: "localNotWorklet" }],
    },
    {
      // The reported bug's exact shape: a worklet calling a plain helper that a
      // sibling worklet wraps.
      code: `
        function renderHeight(scale) { "worklet"; return contentHeight(scale) }
        function contentHeight(scale) { return scale * 24 }
      `,
      options,
      errors: [{ messageId: "localNotWorklet" }],
    },
    {
      // Worklet-ness propagates into nested inline callbacks.
      code: `
        function plain(value) { return value }
        const style = useAnimatedStyle(() => {
          const values = [1].map((value) => plain(value))
          return { top: values[0] }
        })
      `,
      options,
      errors: [{ messageId: "localNotWorklet" }],
    },
    {
      // Handler objects passed to a worklet hook.
      code: `
        function plain(value) { return value }
        const handler = useAnimatedScrollHandler({
          onScroll: (event) => { plain(event.contentOffset.y) },
        })
      `,
      options,
      errors: [{ messageId: "localNotWorklet" }],
    },
  ],
})
