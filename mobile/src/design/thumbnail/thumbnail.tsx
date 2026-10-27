import { Image } from "expo-image"
import { useState } from "react"
import { StyleSheet, View } from "react-native"

import { ThemedText } from "@/design/text/themed-text"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Radii, ThumbnailSize, useTheme } from "@/theme"

export type ThumbnailSizeName = keyof typeof ThumbnailSize

export type ThumbnailSource = {
  light: string | undefined
  dark?: string | undefined
}

export type ThumbnailProps = {
  source: ThumbnailSource
  size: ThumbnailSizeName
  monogram?: string | undefined
  onError?: (() => void) | undefined
  testID: string
}

const decorative = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const

// The artwork overshoots the chip by one point on each edge and is clipped:
// full-bleed art leaves no Android sub-pixel gap at the rounded edge.
const OVERSHOOT = 1

function resolveUri(
  source: ThumbnailSource,
  dark: boolean,
): string | undefined {
  const uri = dark ? (source.dark ?? source.light) : source.light
  return uri === "" ? undefined : uri
}

export function Thumbnail({
  source,
  size,
  monogram,
  onError,
  testID,
}: ThumbnailProps) {
  const theme = useTheme()
  const dark = useColorScheme() === "dark"
  const [failedUri, setFailedUri] = useState<string>()
  const uri = resolveUri(source, dark)
  const side = ThumbnailSize[size]
  const box = { width: side, height: side }

  if (uri === undefined || uri === failedUri) {
    return (
      <View
        {...decorative}
        testID={`${testID}-tile`}
        style={[styles.tile, box, { backgroundColor: theme.primarySoft }]}
      >
        {monogram ? (
          <ThemedText
            testID={`${testID}-monogram`}
            type="headline"
            // The letter is an image stand-in in a fixed tile; the row's
            // label carries the scalable name.
            // eslint-disable-next-line no-restricted-syntax
            allowFontScaling={false}
            style={{ color: theme.onPrimarySoft }}
          >
            {monogram}
          </ThemedText>
        ) : null}
      </View>
    )
  }

  return (
    <View
      {...decorative}
      testID={`${testID}-tile`}
      style={[styles.tile, box, { backgroundColor: theme.logoSurface }]}
    >
      <Image
        testID={testID}
        source={{ uri }}
        contentFit="contain"
        onError={() => {
          setFailedUri(uri)
          onError?.()
        }}
        style={{
          position: "absolute",
          top: -OVERSHOOT,
          start: -OVERSHOOT,
          width: side + 2 * OVERSHOOT,
          height: side + 2 * OVERSHOOT,
        }}
      />
      {/* RN paints children above a view's own border, so the ring is an overlay. */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.ring,
          { borderColor: theme.separator },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: Radii.medium,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radii.medium,
  },
})
