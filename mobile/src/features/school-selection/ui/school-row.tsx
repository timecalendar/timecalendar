import { router } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, StyleSheet } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { useImportDraft } from "@/features/onboarding"
import { type SchoolListItem } from "@/features/school-selection/data"
import { MaxContentWidth, Spacing, useTheme } from "@/theme"

import { SchoolLogo } from "./school-logo"

export function SchoolRow({ school }: { school: SchoolListItem }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { setListedInstitution } = useImportDraft()

  return (
    <Pressable
      testID={`onboarding-school-row-${school.id}`}
      accessibilityRole="button"
      // Label = name verbatim: iOS merges children in, and Maestro matches rows by name.
      accessibilityLabel={school.name}
      accessibilityHint={t("onboarding.school.rowHint")}
      // The import journey (TIM-391), not the group step: `groups` persists a
      // selection and dismisses WITHOUT creating a calendar — a dead end. It
      // keeps its route and stays deep-linkable; deleting it is a separate
      // cleanup (design D10).
      onPress={() => {
        setListedInstitution(school)
        router.push("/onboarding/programme")
      }}
      // foreground ripple: the background lane regresses on New Arch (RN #52939/#54372).
      android_ripple={{ color: theme.ripple, foreground: true }}
      style={({ pressed }) => [
        styles.row,
        Platform.OS === "ios" &&
          pressed && { backgroundColor: theme.backgroundSelected },
      ]}
    >
      <SchoolLogo
        key={`${school.imageUrl}:${school.imageUrlDark ?? ""}`}
        school={school}
      />
      <ThemedText style={styles.rowName}>{school.name}</ThemedText>
      {Platform.OS === "ios" && (
        <SymbolView
          name="chevron.forward"
          size={14}
          weight="semibold"
          tintColor={theme.textTertiary}
        />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rowName: {
    flex: 1,
    // Platform body: iOS 17pt / Android 16sp regular (ThemedText default reads as emphasis).
    ...Platform.select({
      ios: { fontSize: 17, lineHeight: 22, fontWeight: "400" as const },
      default: { fontWeight: "400" as const },
    }),
  },
})
