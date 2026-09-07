import { useTranslation } from "react-i18next"
import { Platform, RefreshControl, ScrollView, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { AdaptiveContent } from "@/components/adaptive-content"
import { ThemedView } from "@/components/themed-view"
import { Spacing, useTheme } from "@/theme"

import { HomeAddFab, HomeScreenHeader } from "./home-screen/home-screen-header"
import { HomeScreenStatus } from "./home-screen/home-screen-status"
import { TodaySection } from "./home-screen/today-section"
import { UpcomingSection } from "./home-screen/upcoming-section"
import { useHomeScreenController } from "./home-screen/use-home-screen-controller"
import { WelcomeCard } from "./home-screen/welcome-card"

export function HomeScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const home = useHomeScreenController()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <AdaptiveContent
          lane="standard"
          testID="home-responsive-owner"
          style={styles.responsiveOwner}
          contentContainerStyle={styles.responsiveLane}
        >
          <HomeScreenHeader onAdd={home.addEvent} />
          <ScrollView
            testID="home-scroll"
            contentContainerStyle={[
              styles.content,
              Platform.OS === "android"
                ? styles.androidContent
                : styles.iosContent,
            ]}
            refreshControl={
              <RefreshControl
                testID="home-refresh"
                refreshing={home.isSyncing}
                onRefresh={home.sync}
                tintColor={theme.primary}
                colors={[theme.primary]}
                accessibilityLabel={t("calendar.sync.refreshingLabel")}
              />
            }
          >
            <WelcomeCard
              now={home.now}
              locale={home.locale}
              displayZone={home.displayZone}
              caption={home.caption}
              greeting={home.greeting}
              events={home.todayEvents}
            />
            <HomeScreenStatus isError={home.isError} onRetry={home.sync} />
            <UpcomingSection
              now={home.now}
              locale={home.locale}
              displayZone={home.displayZone}
              events={home.upcoming}
              checklistProgress={home.checklistProgress}
              todayEventCount={home.todayEvents.length}
              nextDay={home.nextDay}
              onOpenCalendar={home.openCalendar}
              onPressEvent={home.openEvent}
            />
            <TodaySection
              now={home.now}
              locale={home.locale}
              displayZone={home.displayZone}
              allDayEvents={home.allDay}
              timedEvents={home.timed}
              checklistProgress={home.checklistProgress}
              hourRange={home.hourRange}
              onPressEvent={home.openEvent}
            />
          </ScrollView>
          {Platform.OS === "android" && <HomeAddFab onPress={home.addEvent} />}
        </AdaptiveContent>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  responsiveOwner: { flex: 1 },
  responsiveLane: { flex: 1 },
  content: {
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  androidContent: { paddingBottom: 96 },
  iosContent: { paddingBottom: 112 },
})
