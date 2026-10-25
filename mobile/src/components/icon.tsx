import { useFonts } from "expo-font"
import { type SFSymbol, SymbolView, type SymbolWeight } from "expo-symbols"
import materialSymbols from "expo-symbols/androidWeights/regular"
import { Platform, Text, useWindowDimensions, View } from "react-native"

// The Material Symbols codepoints the app draws; icon.test.tsx pins each one
// against expo-symbols' own font table.
export const MATERIAL_GLYPHS = {
  add: 0xe145,
  arrow_forward: 0xe5c8,
  bolt: 0xea0b,
  check_box: 0xe834,
  check_box_outline_blank: 0xe835,
  error_outline: 0xe001,
  link: 0xe157,
  open_in_new: 0xe89e,
  palette: 0xe40a,
  qr_code_scanner: 0xf206,
  school: 0xe80c,
  search: 0xe8b6,
  smartphone: 0xe32c,
  today: 0xe8df,
} as const

export type MaterialGlyph = keyof typeof MATERIAL_GLYPHS

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

function textCap(props: IconScaling): number | undefined {
  if (props.scaling === "fixed") return 1
  return props.maxFontSizeMultiplier
}

export function Icon(props: IconProps) {
  const { fontScale } = useWindowDimensions()
  const cap = textCap(props)
  const resolved = props.size * Math.min(fontScale, cap ?? Infinity)

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
      cap={cap}
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
  cap,
  testID,
}: {
  glyph: MaterialGlyph
  size: number
  box: number
  color: string
  cap: number | undefined
  testID: string | undefined
}) {
  const [loaded] = useFonts({ [materialSymbols.name]: materialSymbols.font })
  return (
    <View {...decorative} testID={testID} style={{ width: box, height: box }}>
      {loaded && (
        <Text
          maxFontSizeMultiplier={cap}
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
