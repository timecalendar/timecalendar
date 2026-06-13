import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { FirebaseDebugPanel } from "@/components/firebase-debug-panel"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { MaxContentWidth, Spacing } from "@/constants/theme"

export default function ProfileScreen() {
  const { t } = useTranslation()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t("profile.title")}</ThemedText>
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
})
