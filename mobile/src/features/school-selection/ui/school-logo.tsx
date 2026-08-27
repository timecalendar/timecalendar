import { Image } from "expo-image"
import { useState } from "react"
import { StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { type SchoolListItem } from "@/features/school-selection/data"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Radii, useTheme } from "@/theme"

export const LogoSize = 40

export function SchoolLogo({ school }: { school: SchoolListItem }) {
  const theme = useTheme()
  const colorScheme = useColorScheme()
  const [failed, setFailed] = useState(false)
  const imageUrl =
    colorScheme === "dark"
      ? (school.imageUrlDark ?? school.imageUrl)
      : school.imageUrl

  if (!imageUrl || failed) {
    return (
      <View
        testID={`onboarding-school-monogram-${school.id}`}
        style={[styles.logo, { backgroundColor: theme.primarySoft }]}
      >
        <ThemedText themeColor="primary" style={styles.monogramLetter}>
          {school.name.trim().charAt(0).toUpperCase()}
        </ThemedText>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.logo,
        styles.logoChip,
        { backgroundColor: theme.logoSurface },
      ]}
    >
      <Image
        testID={`onboarding-school-logo-${school.id}`}
        source={{ uri: imageUrl }}
        contentFit="contain"
        onError={() => setFailed(true)}
        style={styles.logoImage}
      />
      <View
        pointerEvents="none"
        style={[styles.logoRing, { borderColor: theme.separator }]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  // No lineHeight: a tight line box clips the glyph on Android.
  monogramLetter: {
    fontSize: 17,
    fontWeight: "600",
  },
  logo: {
    width: LogoSize,
    height: LogoSize,
    borderRadius: Radii.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  logoChip: {
    overflow: "hidden",
  },
  // 1px overshoot clipped by the chip: full-bleed artwork, no Android sub-pixel
  // edge gap. Explicit size — Android needs deterministic image dimensions.
  logoImage: {
    position: "absolute",
    top: -1,
    left: -1,
    width: LogoSize + 2,
    height: LogoSize + 2,
  },
  // Overlay ring so edge-to-edge artwork can't paint over it (RN draws children above borders).
  logoRing: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radii.medium,
  },
})
