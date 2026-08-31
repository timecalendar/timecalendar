import { useTranslation } from "react-i18next"
import { Platform, RefreshControl, ScrollView, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedView } from "@/components/themed-view"
import { FirstIcalReminder } from "@/features/first-launch/ui"
import { MaxContentWidth, Spacing, useTheme } from "@/theme"

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
            hourRange={home.hourRange}
            onPressEvent={home.openEvent}
          />
        </ScrollView>
        {Platform.OS === "android" && <HomeAddFab onPress={home.addEvent} />}
        <FirstIcalReminder />
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", justifyContent: "center" },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  androidContent: { paddingBottom: 96 },
  iosContent: { paddingBottom: 112 },
})
