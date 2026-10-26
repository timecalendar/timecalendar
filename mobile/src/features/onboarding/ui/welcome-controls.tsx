import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import { AdaptiveContent, Button } from "@/design"
import { Spacing } from "@/theme"

type WelcomeSkipProps = {
  hidden: boolean
  onPress: () => void
}

export function WelcomeSkip({ hidden, onPress }: WelcomeSkipProps) {
  const { t } = useTranslation()

  return (
    <AdaptiveContent lane="readable" contentContainerStyle={styles.topBar}>
      {!hidden && (
        <Button
          variant="text"
          size="small"
          testID="onboarding-skip"
          label={t("onboarding.skip")}
          accessibilityLabel={t("onboarding.skipLabel")}
          onPress={onPress}
        />
      )}
    </AdaptiveContent>
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

  return (
    <AdaptiveContent
      testID="onboarding-footer-content"
      lane="readable"
      contentContainerStyle={styles.footer}
    >
      {isLastPage ? (
        <Button
          variant="filled"
          size="large"
          testID="onboarding-welcome-cta"
          label={t("onboarding.cta")}
          accessibilityLabel={t("onboarding.ctaLabel")}
          onPress={onFinish}
          style={styles.cta}
        />
      ) : (
        <Button
          variant="text"
          size="small"
          testID="onboarding-next"
          label={t("onboarding.next")}
          accessibilityLabel={t("onboarding.nextLabel")}
          icon={{ ios: "arrow.forward", android: "arrow_forward" }}
          iconPosition="trailing"
          onPress={onNext}
        />
      )}
    </AdaptiveContent>
  )
}

const styles = StyleSheet.create({
  topBar: {
    height: 60,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  footer: {
    minHeight: 64,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingBottom: Spacing.four,
  },
  cta: { alignSelf: "stretch" },
})
