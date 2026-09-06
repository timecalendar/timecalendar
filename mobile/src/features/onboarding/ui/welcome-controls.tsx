import { SymbolView } from "expo-symbols"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

const CONTROL_MIN_HEIGHT = Platform.OS === "ios" ? 44 : 48

type WelcomeSkipProps = {
  hidden: boolean
  onPress: () => void
}

export function WelcomeSkip({ hidden, onPress }: WelcomeSkipProps) {
  const { t } = useTranslation()

  return (
    <View style={styles.topBar}>
      {!hidden && (
        <Pressable
          testID="onboarding-skip"
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.skipLabel")}
          onPress={onPress}
          style={styles.textButton}
        >
          <ThemedText type="smallBold" themeColor="primary">
            {t("onboarding.skip")}
          </ThemedText>
        </Pressable>
      )}
    </View>
  )
}

type WelcomeFooterProps = {
  isLastPage: boolean
  onFinish: () => void
  onNext: () => void
}

export function WelcomeFooter({
  isLastPage,
  onFinish,
  onNext,
}: WelcomeFooterProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <View style={styles.footer}>
      {isLastPage ? (
        <Pressable
          testID="onboarding-welcome-cta"
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.ctaLabel")}
          onPress={onFinish}
          style={[styles.cta, { backgroundColor: theme.primaryStrong }]}
        >
          <ThemedText type="smallBold" themeColor="onPrimary">
            {t("onboarding.cta")}
          </ThemedText>
        </Pressable>
      ) : (
        <Pressable
          testID="onboarding-next"
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.nextLabel")}
          onPress={onNext}
          style={styles.nextButton}
        >
          <ThemedText type="smallBold" themeColor="primary">
            {t("onboarding.next")}
          </ThemedText>
          <SymbolView
            name={{
              ios: "arrow.forward",
              android: "arrow_forward",
              web: "arrow_forward",
            }}
            tintColor={theme.primary}
            size={20}
            accessible={false}
          />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: {
    height: 60,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
  textButton: {
    minHeight: CONTROL_MIN_HEIGHT,
    minWidth: CONTROL_MIN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    minHeight: 64,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  nextButton: {
    minHeight: CONTROL_MIN_HEIGHT,
    minWidth: CONTROL_MIN_HEIGHT,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.two,
  },
  cta: {
    width: "100%",
    minHeight: 48,
    borderRadius: Radii.medium,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
  },
})
