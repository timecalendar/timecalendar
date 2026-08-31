import { useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  findNodeHandle,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"

import { ThemedText } from "@/components/themed-text"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

const CONTROL_MIN_HEIGHT = Platform.OS === "ios" ? 44 : 48

export interface ImportLaterConfirmationProps {
  visible: boolean
  cancelLabelKey:
    | "firstLaunch.importLater.continueOnboarding"
    | "firstLaunch.importLater.keepReminder"
  onCancel: () => void
  onConfirm: () => void
}

export function ImportLaterConfirmation({
  visible,
  cancelLabelKey,
  onCancel,
  onConfirm,
}: ImportLaterConfirmationProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const headingRef = useRef<View>(null)

  const focusHeading = () => {
    const handle = findNodeHandle(headingRef.current)
    if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      onShow={focusHeading}
      statusBarTranslucent
      testID="import-later-modal"
    >
      <View
        accessibilityViewIsModal
        style={styles.overlay}
        testID="import-later-confirmation"
      >
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
          testID="import-later-backdrop"
        />
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <ScrollView bounces={false} contentContainerStyle={styles.content}>
            <View
              ref={headingRef}
              accessible
              accessibilityRole="header"
              testID="import-later-heading"
            >
              <ThemedText style={styles.heading}>
                {t("firstLaunch.importLater.title")}
              </ThemedText>
            </View>
            <ThemedText themeColor="textSecondary">
              {t("firstLaunch.importLater.body")}
            </ThemedText>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(cancelLabelKey)}
                onPress={onCancel}
                style={styles.control}
                testID="import-later-cancel"
              >
                <ThemedText type="smallBold" themeColor="actionText">
                  {t(cancelLabelKey)}
                </ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("firstLaunch.importLater.confirm")}
                onPress={onConfirm}
                style={[
                  styles.control,
                  styles.confirm,
                  { backgroundColor: theme.primaryStrong },
                ]}
                testID="import-later-confirm"
              >
                <ThemedText type="smallBold" themeColor="onPrimary">
                  {t("firstLaunch.importLater.confirm")}
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.four,
    backgroundColor: "#00000080",
  },
  card: {
    alignSelf: "center",
    borderRadius: Radii.large,
    maxHeight: "90%",
    maxWidth: Math.min(MaxContentWidth, 520),
    width: "100%",
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  heading: {
    fontSize: 32,
    fontWeight: "600",
    lineHeight: 44,
  },
  actions: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  control: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: CONTROL_MIN_HEIGHT,
    paddingHorizontal: Spacing.three,
  },
  confirm: {
    borderRadius: Radii.medium,
  },
})
