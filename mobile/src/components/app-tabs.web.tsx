import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from "expo-router/ui"
import { useTranslation } from "react-i18next"
import { Pressable, View, StyleSheet } from "react-native"

import { ThemedText } from "./themed-text"
import { ThemedView } from "./themed-view"

import { MaxContentWidth, Spacing } from "@/constants/theme"

export default function AppTabs() {
  const { t } = useTranslation()

  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>{t("home.tab.label")}</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>{t("profile.tab.label")}</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  )
}

export function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? "backgroundSelected" : "backgroundElement"}
        style={styles.tabButtonView}
      >
        <ThemedText
          type="small"
          themeColor={isFocused ? "text" : "textSecondary"}
        >
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  )
}

export function CustomTabList(props: TabListProps) {
  const { t } = useTranslation()

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          {t("app.name")}
        </ThemedText>

        {props.children}
      </ThemedView>
    </View>
  )
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: "absolute",
    width: "100%",
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: "auto",
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
})
