import { Platform, type TextProps, type TextStyle } from "react-native"

export type TypeVariant =
  | "largeTitle"
  | "title"
  | "title2"
  | "sectionTitle"
  | "headline"
  | "body"
  | "callout"
  | "label"
  | "footnote"
  | "caption"
  | "captionSmall"

export type TypeStep = {
  style: Pick<
    TextStyle,
    "fontSize" | "lineHeight" | "fontWeight" | "letterSpacing"
  >
  dynamicTypeRamp?: TextProps["dynamicTypeRamp"]
}

// No dynamicTypeRamp: the calendar renderer caps these with maxFontSizeMultiplier and
// relies on linear scaling to fit narrow tiles.
const denseSteps = {
  caption: { style: { fontSize: 12, lineHeight: 14, fontWeight: 600 } },
  captionSmall: { style: { fontSize: 11, lineHeight: 13, fontWeight: 400 } },
} satisfies Pick<Record<TypeVariant, TypeStep>, "caption" | "captionSmall">

// No letterSpacing on iOS: SF applies optical-size tracking itself.
const iosRamp = {
  largeTitle: {
    style: { fontSize: 34, lineHeight: 41, fontWeight: 700 },
    dynamicTypeRamp: "largeTitle",
  },
  title: {
    style: { fontSize: 28, lineHeight: 34, fontWeight: 700 },
    dynamicTypeRamp: "title1",
  },
  title2: {
    style: { fontSize: 22, lineHeight: 28, fontWeight: 700 },
    dynamicTypeRamp: "title2",
  },
  sectionTitle: {
    style: { fontSize: 20, lineHeight: 25, fontWeight: 600 },
    dynamicTypeRamp: "title3",
  },
  headline: {
    style: { fontSize: 17, lineHeight: 22, fontWeight: 600 },
    dynamicTypeRamp: "headline",
  },
  body: {
    style: { fontSize: 17, lineHeight: 22, fontWeight: 400 },
    dynamicTypeRamp: "body",
  },
  callout: {
    style: { fontSize: 16, lineHeight: 21, fontWeight: 400 },
    dynamicTypeRamp: "callout",
  },
  label: {
    style: { fontSize: 15, lineHeight: 20, fontWeight: 600 },
    dynamicTypeRamp: "subheadline",
  },
  footnote: {
    style: { fontSize: 13, lineHeight: 18, fontWeight: 400 },
    dynamicTypeRamp: "footnote",
  },
  ...denseSteps,
} satisfies Record<TypeVariant, TypeStep>

const androidRamp = {
  largeTitle: {
    style: { fontSize: 32, lineHeight: 40, fontWeight: 400, letterSpacing: 0 },
  },
  title: {
    style: { fontSize: 28, lineHeight: 36, fontWeight: 400, letterSpacing: 0 },
  },
  title2: {
    style: { fontSize: 24, lineHeight: 32, fontWeight: 400, letterSpacing: 0 },
  },
  sectionTitle: {
    style: { fontSize: 22, lineHeight: 28, fontWeight: 400, letterSpacing: 0 },
  },
  headline: {
    style: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: 500,
      letterSpacing: 0.15,
    },
  },
  body: {
    style: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: 400,
      letterSpacing: 0.5,
    },
  },
  callout: {
    style: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: 400,
      letterSpacing: 0.25,
    },
  },
  label: {
    style: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: 500,
      letterSpacing: 0.1,
    },
  },
  footnote: {
    style: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: 400,
      letterSpacing: 0.4,
    },
  },
  ...denseSteps,
} satisfies Record<TypeVariant, TypeStep>

export const TypeRamp: Readonly<Record<TypeVariant, TypeStep>> =
  Platform.select<Record<TypeVariant, TypeStep>>({
    ios: iosRamp,
    default: androidRamp,
  })
