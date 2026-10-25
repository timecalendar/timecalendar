import { useFonts } from "expo-font"
import { type SFSymbol, SymbolView, type SymbolWeight } from "expo-symbols"
import materialSymbols from "expo-symbols/androidWeights/regular"
import { Platform, Text, useWindowDimensions, View } from "react-native"

import { MATERIAL_GLYPHS, type MaterialGlyph } from "./icon-glyphs"

export type { MaterialGlyph }

/**
 * `text`: the icon sits beside or inside text and grows with the OS font scale
 * (up to `maxFontSizeMultiplier`), so its container must not fix its size.
 * `fixed`: standalone chrome that keeps its design size at every text size.
 */
export type IconScaling =
  | { scaling: "fixed" }
  | { scaling: "text"; maxFontSizeMultiplier?: number }

export type IconProps = {
  ios?: SFSymbol
  android?: MaterialGlyph
  size: number
  color: string
  iosWeight?: SymbolWeight
  testID?: string
} & IconScaling

const decorative = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const

function resolveSize(props: IconProps, fontScale: number): number {
  if (props.scaling === "fixed") return props.size
  return (
    props.size * Math.min(fontScale, props.maxFontSizeMultiplier ?? Infinity)
  )
}

export function Icon(props: IconProps) {
  const { fontScale } = useWindowDimensions()
  const resolved = resolveSize(props, fontScale)

  if (Platform.OS === "ios") {
    if (props.ios === undefined) return null
    return (
      <SymbolView
        {...decorative}
        name={props.ios}
        size={resolved}
        tintColor={props.color}
        {...(props.iosWeight !== undefined ? { weight: props.iosWeight } : {})}
        {...(props.testID !== undefined ? { testID: props.testID } : {})}
      />
    )
  }

  if (props.android === undefined) return null
  return (
    <MaterialIcon
      glyph={props.android}
      size={props.size}
      box={resolved}
      color={props.color}
      scaling={props}
      testID={props.testID}
    />
  )
}

// expo-symbols draws Android glyphs as a font-scaled Text inside a fixed
// `size` box, so the glyph outgrows and clips its box at large font scales.
function MaterialIcon({
  glyph,
  size,
  box,
  color,
  scaling,
  testID,
}: {
  glyph: MaterialGlyph
  size: number
  box: number
  color: string
  scaling: IconScaling
  testID: string | undefined
}) {
  const [loaded] = useFonts({ [materialSymbols.name]: materialSymbols.font })
  return (
    <View
      {...decorative}
      testID={testID}
      style={{
        width: box,
        height: box,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {loaded && (
        <Text
          {...(scaling.scaling === "fixed"
            ? // A fixed icon is a glyph drawn like an image: it keeps its
              // design size below the default text size too.
              // eslint-disable-next-line no-restricted-syntax
              { allowFontScaling: false }
            : { maxFontSizeMultiplier: scaling.maxFontSizeMultiplier })}
          style={{
            fontFamily: materialSymbols.name,
            color,
            fontSize: size,
            lineHeight: size,
          }}
        >
          {String.fromCharCode(MATERIAL_GLYPHS[glyph])}
        </Text>
      )}
    </View>
  )
}
