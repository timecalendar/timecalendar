import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  isImportNameWithinLimit,
  normalizeImportName,
  useImportDraft,
} from "@/features/onboarding/draft"
import { clearSelection } from "@/features/school-selection"
import { Spacing, useTheme } from "@/theme"

import { stepStyles } from "./step-styles"

// The unlisted-institution step (TIM-391) — reached from the school picker's
// "I can't find my school" action, which used to jump straight to the iCal-URL
// route and lose the institution entirely.
//
// The name is REQUIRED here (unlike the programme name, which Skip may leave
// empty): this is the only institution signal an unlisted import will ever
// carry, so an empty one would produce a calendar support cannot place.
//
// Submitting also clears the legacy persisted school selection. The draft is the
// only creation source of truth, but the MMKV selection still exists (the group
// step writes it), and leaving a stale school id there is exactly how an unlisted
// import gets attributed to a school the student explicitly said they could not
// find (design D10).
export default function InstitutionNameScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { setUnlistedInstitution } = useImportDraft()
  const [name, setName] = useState("")
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const submit = () => {
    const normalized = normalizeImportName(name)
    if (normalized === "") {
      setErrorKey("onboarding.institution.error.required")
      return
    }
    if (!isImportNameWithinLimit(normalized)) {
      setErrorKey("onboarding.institution.error.tooLong")
      return
    }
    setErrorKey(null)
    setUnlistedInstitution(normalized)
    clearSelection()
    router.push("/onboarding/programme")
  }

  return (
    <ThemedView style={stepStyles.container}>
      <SafeAreaView style={stepStyles.safeArea}>
        <KeyboardAvoidingView
          style={stepStyles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={stepStyles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={stepStyles.intro}>
              <ThemedText type="title">
                {t("onboarding.institution.title")}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                {t("onboarding.institution.helper")}
              </ThemedText>
            </View>

            <ThemedText
              nativeID="onboarding-institution-label"
              type="smallBold"
            >
              {t("onboarding.institution.fieldLabel")}
            </ThemedText>
            <TextInput
              testID="onboarding-institution-input"
              accessibilityLabel={t("onboarding.institution.fieldLabel")}
              accessibilityLabelledBy="onboarding-institution-label"
              placeholder={t("onboarding.institution.placeholder")}
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={(next) => {
                setName(next)
                if (errorKey !== null) setErrorKey(null)
              }}
              autoCapitalize="words"
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
                testID="onboarding-institution-error"
                themeColor="textSecondary"
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                {t(errorKey)}
              </ThemedText>
            )}

            <Pressable
              testID="onboarding-institution-continue"
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.institution.continueLabel")}
              hitSlop={Spacing.two}
              onPress={submit}
              style={[stepStyles.cta, { backgroundColor: theme.primaryStrong }]}
            >
              <ThemedText type="smallBold" themeColor="onPrimary">
                {t("onboarding.institution.continue")}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  )
}
