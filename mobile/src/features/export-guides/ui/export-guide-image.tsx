import { Image } from "expo-image"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import type { ExportGuideImage as ExportGuideImageValue } from "@/features/export-guides/data"
import { Radii, Spacing, useTheme } from "@/theme"

export function ExportGuideImage({
  image,
  testID,
  onFailure,
}: {
  image: ExportGuideImageValue
  testID: string
  onFailure: () => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [failed, setFailed] = useState(false)
  const fail = () => {
    setFailed(true)
    onFailure()
  }

  return (
    <View style={styles.block}>
      {failed ? (
        <View
          testID={`${testID}-placeholder`}
          accessible
          accessibilityRole="image"
          accessibilityLabel={image.altText}
          style={[
            styles.image,
            styles.placeholder,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <ThemedText themeColor="textSecondary">
            {t("exportGuide.imageUnavailable")}
          </ThemedText>
        </View>
      ) : (
        <Image
          testID={testID}
          source={{ uri: image.url }}
          contentFit="contain"
          accessibilityLabel={image.altText}
          accessibilityRole="image"
          onError={fail}
          style={[styles.image, { backgroundColor: theme.backgroundElement }]}
        />
      )}
      {image.caption === undefined ? null : (
        <ThemedText themeColor="textSecondary">{image.caption}</ThemedText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  block: { gap: Spacing.two },
  image: { width: "100%", minHeight: 180, borderRadius: Radii.medium },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
  },
})
