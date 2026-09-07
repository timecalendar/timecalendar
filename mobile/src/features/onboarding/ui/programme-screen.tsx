import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, StyleSheet, TextInput } from "react-native"

import { KeyboardSafeActionLayout } from "@/components/keyboard-safe-action-layout"
import { PrimaryAction } from "@/components/primary-action"
import { PageIntro, RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import {
  isImportNameWithinLimit,
  normalizeImportName,
  useImportDraft,
} from "@/features/onboarding/draft"
import { Spacing, useTheme } from "@/theme"

import { stepStyles } from "./step-styles"

// The programme step (TIM-391 / design D4, D5) — "Nom de formation" (the
// *formation*, i.e. programme of study, not a grade: TIM-274 established this is
// what students actually type and what support recognises a cohort by).
//
// Skip is a QUIET TRAILING NATIVE HEADER ACTION, not a second in-body button.
// That is the spec's requirement and it is also what keeps the naming default
// right: with one primary Continue in the body, skipping is a deliberate
// secondary act rather than an equally-weighted choice, so an empty name is
// never the path of least resistance. Continue is disabled while the field is
// empty, which makes Skip the ONLY route to an empty name — the app never
// invents one.
//
// The platform split mirrors school-picker-screen.tsx's header-LEFT treatment:
// iOS gets a real `unstable_headerRightItems` text item, Android a `headerRight`
// Pressable sized to the 48dp minimum target.
export default function ProgrammeScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { setCalendarName } = useImportDraft()
  const [name, setName] = useState("")
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const normalized = normalizeImportName(name)
  const canContinue = normalized !== ""

  const advance = (value: string) => {
    setCalendarName(value)
    router.push("/onboarding/connect")
  }

  const submit = () => {
    if (!canContinue) return
    if (!isImportNameWithinLimit(normalized)) {
      setErrorKey("onboarding.programme.error.tooLong")
      return
    }
    setErrorKey(null)
    advance(normalized)
  }

  const skip = () => advance("")

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("onboarding.programme.title"),
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: theme.background },
          headerShadowVisible: false,
          ...(Platform.OS === "ios" && {
            unstable_headerRightItems: () => [
              {
                type: "button" as const,
                label: t("onboarding.programme.skip"),
                accessibilityLabel: t("onboarding.programme.skipLabel"),
                tintColor: theme.primary,
                identifier: "onboarding-programme-skip",
                onPress: skip,
              },
            ],
          }),
          ...(Platform.OS === "android" && {
            headerRight: () => (
              <Pressable
                testID="onboarding-programme-skip"
                accessibilityRole="button"
                accessibilityLabel={t("onboarding.programme.skipLabel")}
                hitSlop={Spacing.two}
                onPress={skip}
                style={styles.headerSkip}
              >
                <ThemedText type="smallBold" themeColor="primary">
                  {t("onboarding.programme.skip")}
                </ThemedText>
              </Pressable>
            ),
          }),
        }}
      />
      <RootPage
        testID="onboarding-programme-content"
        lane="readable"
        style={stepStyles.fill}
      >
        {() => (
          <KeyboardSafeActionLayout
            testID="onboarding-programme-keyboard-layout"
            contentContainerStyle={stepStyles.formContent}
            actionContainerStyle={styles.actionRegion}
            actions={
              <PrimaryAction
                testID="onboarding-programme-continue"
                label={t("onboarding.programme.continue")}
                accessibilityLabel={t("onboarding.programme.continueLabel")}
                disabled={!canContinue}
                onPress={submit}
              />
            }
          >
            <PageIntro caption={t("onboarding.programme.helper")} />

            <ThemedText nativeID="onboarding-programme-label" type="smallBold">
              {t("onboarding.programme.fieldLabel")}
            </ThemedText>
            <TextInput
              testID="onboarding-programme-input"
              accessibilityLabel={t("onboarding.programme.fieldLabel")}
              accessibilityLabelledBy="onboarding-programme-label"
              // Example only — a `placeholder` prop can never reach the draft.
              placeholder={t("onboarding.programme.placeholder")}
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={(next) => {
                setName(next)
                if (errorKey !== null) setErrorKey(null)
              }}
              autoCapitalize="sentences"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={submit}
              style={[
                stepStyles.input,
                { color: theme.text, borderColor: theme.backgroundSelected },
              ]}
            />

            {errorKey !== null && (
              <ThemedText
                testID="onboarding-programme-error"
                themeColor="textSecondary"
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                {t(errorKey)}
              </ThemedText>
            )}
          </KeyboardSafeActionLayout>
        )}
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  actionRegion: { paddingTop: Spacing.three, paddingBottom: Spacing.four },
  // Local: the Android header action, the only control this step adds to the
  // shared step frame. 48dp minimum in both axes (the iOS branch is a native
  // header item and is sized by the platform).
  headerSkip: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: Spacing.two,
  },
})
