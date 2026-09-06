import { forwardRef } from "react"
import { StyleSheet } from "react-native"
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view"

import { useTheme } from "@/theme"

import { WELCOME_PAGES } from "./welcome-page-catalog"
import { WelcomePage } from "./welcome-pages"

type WelcomePagerProps = {
  illustrationHeight: number
  onPageSelected: (event: PagerViewOnPageSelectedEvent) => void
}

export const WelcomePager = forwardRef<PagerView, WelcomePagerProps>(
  function WelcomePager({ illustrationHeight, onPageSelected }, ref) {
    const theme = useTheme()

    return (
      <PagerView
        ref={ref}
        testID="onboarding-pager"
        initialPage={0}
        onPageSelected={onPageSelected}
        style={styles.pager}
      >
        {WELCOME_PAGES.map((page) => (
          <WelcomePage
            key={page.id}
            page={page}
            illustrationBackgroundColor={theme.backgroundElement}
            illustrationHeight={illustrationHeight}
          />
        ))}
      </PagerView>
    )
  },
)

const styles = StyleSheet.create({
  pager: {
    flex: 1,
  },
})
