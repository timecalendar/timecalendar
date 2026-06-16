import { Link } from "expo-router"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { FirebaseDebugPanel } from "@/components/firebase-debug-panel"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { MaxContentWidth, Spacing } from "@/theme"

export default function ProfileScreen() {
  const { t } = useTranslation()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t("profile.title")}</ThemedText>

        {/* The first real product touchable (the only prior one was the
            __DEV__ FirebaseDebugPanel): an accessible Profile→Settings entry.
            Declares a role + translated label, and a min 44pt/48dp hit target
            (paddingVertical:Spacing.three=16 + the text line ≈ ≥48; hitSlop
            backstops it). asChild lets Link forward navigation to the Pressable
            so a11y props ride the touchable, not a wrapping anchor. */}
        <Link href="/settings" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t("profile.settings.link")}
            hitSlop={Spacing.two}
            style={styles.settingsLink}
          >
            <ThemedText>{t("profile.settings.link")}</ThemedText>
          </Pressable>
        </Link>

        {/* Onboarding (school selection) entry — the read-path flow off Profile
            (C1 / TIM-134), same accessible-link shape as the Settings link. */}
        <Link href="/onboarding" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t("profile.onboarding.link")}
            hitSlop={Spacing.two}
            style={styles.settingsLink}
          >
            <ThemedText>{t("profile.onboarding.link")}</ThemedText>
          </Pressable>
        </Link>

        {/* The standalone personal-events list, relocated off the Home tab (ADR
            022 — the Home tab is now the today view). Same accessible-link shape
            as the Settings / onboarding entries. */}
        <Link href="/personal-events" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t("profile.personalEvents.link")}
            hitSlop={Spacing.two}
            style={styles.settingsLink}
          >
            <ThemedText>{t("profile.personalEvents.link")}</ThemedText>
          </Pressable>
        </Link>

        {__DEV__ && <FirebaseDebugPanel />}
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  settingsLink: {
    paddingVertical: Spacing.three,
    justifyContent: "center",
  },
})
