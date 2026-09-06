import { router } from "expo-router"
import { useRef, useState } from "react"
import { StyleSheet, useWindowDimensions } from "react-native"
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedView } from "@/components/themed-view"

import { useReducedMotion } from "./use-reduced-motion"
import { WelcomeFooter, WelcomeSkip } from "./welcome-controls"
import { WelcomeEntrance } from "./welcome-entrance"
import { WELCOME_PAGES } from "./welcome-page-catalog"
import { WelcomePageIndicator } from "./welcome-page-indicator"
import { WelcomePager } from "./welcome-pager"

const ILLUSTRATION_HEIGHT_RATIO = 0.25
const MAX_ILLUSTRATION_HEIGHT = 260

export default function WelcomeScreen() {
  const { height: windowHeight } = useWindowDimensions()
  const pagerRef = useRef<PagerView>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const reduceMotion = useReducedMotion()
  const isLastPage = currentPage === WELCOME_PAGES.length - 1
  const illustrationHeight = Math.min(
    windowHeight * ILLUSTRATION_HEIGHT_RATIO,
    MAX_ILLUSTRATION_HEIGHT,
  )

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
        <WelcomeEntrance reduceMotion={reduceMotion}>
          <WelcomeSkip hidden={isLastPage} onPress={openSchoolSelection} />
          <WelcomePager
            ref={pagerRef}
            illustrationHeight={illustrationHeight}
            onPageSelected={handlePageSelected}
          />
          <WelcomePageIndicator
            currentPage={currentPage}
            reduceMotion={reduceMotion}
          />
          <WelcomeFooter
            isLastPage={isLastPage}
            onFinish={openSchoolSelection}
            onNext={goToNextPage}
          />
        </WelcomeEntrance>
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
})
