import { Image, type ImageSource } from "expo-image"
import { router } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native"
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

const FADE_IN_MS = 300
const INDICATOR_ANIMATION_MS = 150
const ACTIVE_INDICATOR_WIDTH = 24
const INACTIVE_INDICATOR_WIDTH = 16
const ILLUSTRATION_HEIGHT_RATIO = 0.25
const MAX_ILLUSTRATION_HEIGHT = 260
const PAGE_COUNT = 3
const CONTROL_MIN_HEIGHT = Platform.OS === "ios" ? 44 : 48

const PAGES = [
  {
    id: "welcome",
    titleKey: "onboarding.page.welcome.title",
    bodyKey: "onboarding.page.welcome.body",
    source: require("@/assets/images/onboarding/welcome.png") as ImageSource,
  },
  {
    id: "agenda",
    titleKey: "onboarding.page.agenda.title",
    bodyKey: "onboarding.page.agenda.body",
    source: require("@/assets/images/onboarding/agenda.png") as ImageSource,
  },
  {
    id: "notifications",
    titleKey: "onboarding.page.notifications.title",
    bodyKey: "onboarding.page.notifications.body",
    source:
      require("@/assets/images/onboarding/notifications.png") as ImageSource,
  },
] as const

export default function WelcomeScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { height: windowHeight } = useWindowDimensions()
  const pagerRef = useRef<PagerView>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)
  const [opacity] = useState(() => new Animated.Value(0))
  const [indicatorWidths] = useState(() =>
    PAGES.map(
      (_, index) =>
        new Animated.Value(
          index === 0 ? ACTIVE_INDICATOR_WIDTH : INACTIVE_INDICATOR_WIDTH,
        ),
    ),
  )

  const isLastPage = currentPage === PAGE_COUNT - 1
  const illustrationHeight = Math.min(
    windowHeight * ILLUSTRATION_HEIGHT_RATIO,
    MAX_ILLUSTRATION_HEIGHT,
  )

  useEffect(() => {
    let active = true
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled)
    })
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    )
    return () => {
      active = false
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    if (reduceMotion === null) return

    if (reduceMotion) {
      opacity.setValue(1)
      return
    }

    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_IN_MS,
      useNativeDriver: true,
    })
    animation.start()
    return () => animation.stop()
  }, [opacity, reduceMotion])

  useEffect(() => {
    if (reduceMotion === null) return

    const targets = indicatorWidths.map((width, index) => ({
      width,
      toValue:
        index === currentPage
          ? ACTIVE_INDICATOR_WIDTH
          : INACTIVE_INDICATOR_WIDTH,
    }))
    if (reduceMotion) {
      targets.forEach(({ width, toValue }) => width.setValue(toValue))
      return
    }

    const animation = Animated.parallel(
      targets.map(({ width, toValue }) =>
        Animated.timing(width, {
          toValue,
          duration: INDICATOR_ANIMATION_MS,
          useNativeDriver: false,
        }),
      ),
    )
    animation.start()
    return () => animation.stop()
  }, [currentPage, indicatorWidths, reduceMotion])

  const handlePageSelected = (event: PagerViewOnPageSelectedEvent) => {
    setCurrentPage(event.nativeEvent.position)
  }

  const goToNextPage = () => {
    const nextPage = currentPage + 1
    if (reduceMotion) {
      pagerRef.current?.setPageWithoutAnimation(nextPage)
      return
    }
    pagerRef.current?.setPage(nextPage)
  }

  const openSchoolSelection = () => router.push("/onboarding/school")

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity }]}>
          <View style={styles.topBar}>
            {!isLastPage && (
              <Pressable
                testID="onboarding-skip"
                accessibilityRole="button"
                accessibilityLabel={t("onboarding.skipLabel")}
                onPress={openSchoolSelection}
                style={styles.textButton}
              >
                <ThemedText type="smallBold" themeColor="primary">
                  {t("onboarding.skip")}
                </ThemedText>
              </Pressable>
            )}
          </View>

          <PagerView
            ref={pagerRef}
            testID="onboarding-pager"
            initialPage={0}
            onPageSelected={handlePageSelected}
            style={styles.pager}
          >
            {PAGES.map((page) => (
              <View key={page.id} collapsable={false} style={styles.page}>
                <View style={styles.pageContent}>
                  <View
                    accessible={false}
                    importantForAccessibility="no-hide-descendants"
                    style={[
                      styles.illustrationCard,
                      {
                        backgroundColor: theme.backgroundElement,
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
                    <ThemedText
                      themeColor="textSecondary"
                      style={styles.centeredText}
                    >
                      {t(page.bodyKey)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </PagerView>

          <View
            testID="onboarding-page-indicator"
            accessible
            accessibilityLabel={t("onboarding.pageIndicator", {
              current: currentPage + 1,
              total: PAGE_COUNT,
            })}
            style={styles.indicator}
          >
            {indicatorWidths.map((width, index) => (
              <Animated.View
                key={String(index)}
                accessible={false}
                importantForAccessibility="no"
                testID={`onboarding-page-indicator-${index}`}
                style={[
                  styles.indicatorPill,
                  {
                    backgroundColor:
                      index === currentPage
                        ? theme.primary
                        : theme.backgroundSelected,
                    width,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.footer}>
            {isLastPage ? (
              <Pressable
                testID="onboarding-welcome-cta"
                accessibilityRole="button"
                accessibilityLabel={t("onboarding.ctaLabel")}
                onPress={openSchoolSelection}
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
                onPress={goToNextPage}
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
        </Animated.View>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
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
  pager: {
    flex: 1,
  },
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
  indicator: {
    minHeight: CONTROL_MIN_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  indicatorPill: {
    height: Spacing.two,
    borderRadius: Radii.pill,
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
