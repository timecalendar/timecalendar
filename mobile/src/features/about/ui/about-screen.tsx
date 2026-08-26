import * as Linking from "expo-linking"
import { Stack } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import type { TFunction } from "i18next"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { readApplicationInfo } from "@/features/about/data"
import {
  SettingsRow,
  type SettingsRowProps,
  SettingsSection,
} from "@/features/settings/ui"
import { recordUnknownError } from "@/firebase"
import { MaxContentWidth, Spacing, useTheme } from "@/theme"

const PRIVACY_URL = "https://timecalendar.app/privacy-policy"
const CONTACT_URL = "mailto:hello@timecalendar.app"
const SAMUEL_URL = "https://www.samuelprak.fr/"
const EDDY_URL = "https://www.eddymonnot.com/"

function formatApplicationInfo(t: TFunction): string {
  const info = readApplicationInfo()
  switch (info.kind) {
    case "versionAndBuild":
      return t("about.version.versionAndBuild", info)
    case "versionOnly":
      return t("about.version.versionOnly", info)
    case "buildOnly":
      return t("about.version.buildOnly", info)
    case "unavailable":
      return t("about.version.unavailable")
  }
}

export function AboutScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const [linkFailed, setLinkFailed] = useState(false)
  const versionValue = formatApplicationInfo(t)
  const openLink = async (
    context: string,
    action: () => Promise<unknown>,
  ): Promise<void> => {
    setLinkFailed(false)
    try {
      await action()
    } catch (error) {
      recordUnknownError(error, context)
      setLinkFailed(true)
    }
  }
  const sections: readonly {
    key: string
    title: string
    rows: readonly SettingsRowProps[]
  }[] = [
    {
      key: "privacy",
      title: t("about.section.privacy"),
      rows: [
        {
          variant: "action",
          first: true,
          icon: {
            ios: "hand.raised",
            android: "privacy_tip",
            web: "privacy_tip",
          },
          label: t("about.privacy.label"),
          hint: t("about.privacy.hint"),
          testID: "about-privacy",
          onPress: () =>
            void openLink("about/open-privacy", () =>
              WebBrowser.openBrowserAsync(PRIVACY_URL),
            ),
        },
      ],
    },
    {
      key: "contact",
      title: t("about.section.contact"),
      rows: [
        {
          variant: "action",
          first: true,
          icon: { ios: "envelope", android: "mail", web: "mail" },
          label: t("about.contact.label"),
          secondary: t("about.contact.value"),
          hint: t("about.contact.hint"),
          testID: "about-contact",
          onPress: () =>
            void openLink("about/open-contact", () =>
              Linking.openURL(CONTACT_URL),
            ),
        },
      ],
    },
    {
      key: "app",
      title: t("about.section.app"),
      rows: [
        {
          variant: "value",
          first: true,
          icon: { ios: "info.circle", android: "info", web: "info" },
          label: t("about.version.label"),
          value: versionValue,
          testID: "about-version",
        },
      ],
    },
    {
      key: "developers",
      title: t("about.section.developers"),
      rows: [
        {
          variant: "action",
          first: true,
          icon: { ios: "person", android: "person", web: "person" },
          label: t("about.developer.samuel"),
          hint: t("about.developer.hint", {
            name: t("about.developer.samuel"),
          }),
          testID: "about-developer-samuel",
          onPress: () =>
            void openLink("about/open-developer", () =>
              WebBrowser.openBrowserAsync(SAMUEL_URL),
            ),
        },
        {
          variant: "action",
          icon: { ios: "person", android: "person", web: "person" },
          label: t("about.developer.eddy"),
          hint: t("about.developer.hint", {
            name: t("about.developer.eddy"),
          }),
          testID: "about-developer-eddy",
          onPress: () =>
            void openLink("about/open-developer", () =>
              WebBrowser.openBrowserAsync(EDDY_URL),
            ),
        },
      ],
    },
  ]

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      testID="about-safe-area"
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ title: t("about.title") }} />
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.blurb}>
            <ThemedText>{t("about.blurb.access")}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {t("about.blurb.created")}
            </ThemedText>
          </View>
          {linkFailed && (
            <ThemedText
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              themeColor="textSecondary"
              style={styles.linkError}
            >
              {t("about.linkError")}
            </ThemedText>
          )}
          {sections.map((section) => (
            <SettingsSection
              key={section.key}
              title={section.title}
              testID={`about-section-${section.key}`}
            >
              {section.rows.map((row) => (
                <SettingsRow key={row.testID} {...row} />
              ))}
            </SettingsSection>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: Platform.OS === "ios" ? Spacing.three : Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  content: {
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: Platform.OS === "ios" ? Spacing.four : Spacing.five,
  },
  blurb: { gap: Spacing.two, paddingHorizontal: Spacing.three },
  linkError: { paddingHorizontal: Spacing.three },
})
