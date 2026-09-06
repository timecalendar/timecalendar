import { Image } from "expo-image"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { MaxContentWidth, Radii, Spacing } from "@/theme"

import { type WelcomePageDescriptor } from "./welcome-page-catalog"

type WelcomePageProps = {
  illustrationBackgroundColor: string
  illustrationHeight: number
  page: WelcomePageDescriptor
}

export function WelcomePage({
  illustrationBackgroundColor,
  illustrationHeight,
  page,
}: WelcomePageProps) {
  const { t } = useTranslation()

  return (
    <View collapsable={false} style={styles.page}>
      <View style={styles.pageContent}>
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.illustrationCard,
            {
              backgroundColor: illustrationBackgroundColor,
              height: illustrationHeight,
            },
          ]}
        >
          <Image
            testID={`onboarding-illustration-${page.id}`}
            source={page.source}
            contentFit="contain"
            accessible={false}
            style={styles.illustration}
          />
        </View>
        <View style={styles.copy}>
          <ThemedText type="title" style={styles.centeredText}>
            {t(page.titleKey)}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centeredText}>
            {t(page.bodyKey)}
          </ThemedText>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  pageContent: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  illustrationCard: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    borderRadius: Radii.large,
    padding: Spacing.three,
    overflow: "hidden",
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  copy: {
    gap: Spacing.three,
  },
  centeredText: {
    textAlign: "center",
  },
})
