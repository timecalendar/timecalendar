import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import { useHeaderActions } from "@/components/chrome"
import {
  Button,
  KeyboardSafeActionLayout,
  PageIntro,
  RootPage,
  TextField,
} from "@/design"
import { emitExportGuideEvent } from "@/features/export-guides/ui"
import {
  decideIntranetUrl,
  isImportNameWithinLimit,
  normalizeImportName,
  useImportDraft,
  useJourneyGateRoute,
} from "@/features/onboarding/draft"
import { Spacing } from "@/theme"

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
export default function ProgrammeScreen() {
  const { t } = useTranslation()
  const { state, draft, setCalendarName } = useImportDraft()
  const legal = useJourneyGateRoute(state, "programme")
  const [name, setName] = useState("")
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const normalized = normalizeImportName(name)
  const canContinue = normalized !== ""

  const advance = (value: string) => {
    setCalendarName(value)
    if (draft?.institution.kind === "unlisted") {
      router.push("/onboarding/export-guide/providers")
      return
    }
    if (draft?.institution.kind !== "listed") {
      router.replace("/onboarding/school")
      return
    }
    const { exportGuide } = draft.institution.school
    if (exportGuide.requireConnect) {
      const intranet = decideIntranetUrl(draft.institution.school.intranetUrl)
      if (intranet.kind === "safe") {
        router.push("/onboarding/connect")
        return
      }
      emitExportGuideEvent({
        name: "export_guide_connect_skipped",
        params: {
          reason: intranet.kind === "missing" ? "missing_url" : "unsafe_url",
          provider_slug: exportGuide.providerSlug,
        },
      })
    }
    router.push("/onboarding/export-guide/0")
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

  const headerActions = useHeaderActions({
    right: [
      {
        label: t("onboarding.programme.skip"),
        accessibilityLabel: t("onboarding.programme.skipLabel"),
        testID: "onboarding-programme-skip",
        onPress: skip,
      },
    ],
  })

  if (!legal) return null

  return (
    <>
      <Stack.Screen
        options={{
          title: t("onboarding.programme.title"),
          ...headerActions,
        }}
      />
      <RootPage
        testID="onboarding-programme-content"
        lane="readable"
        style={stepStyles.fill}
      >
        {() => (
          <KeyboardSafeActionLayout
            scrollsUnderHeader={false}
            testID="onboarding-programme-keyboard-layout"
            contentContainerStyle={stepStyles.formContent}
            actionContainerStyle={styles.actionRegion}
            actions={
              <Button
                variant="filled"
                testID="onboarding-programme-continue"
                label={t("onboarding.programme.continue")}
                accessibilityLabel={t("onboarding.programme.continueLabel")}
                disabled={!canContinue}
                onPress={submit}
              />
            }
          >
            <PageIntro caption={t("onboarding.programme.helper")} />

            <TextField
              testID="onboarding-programme-input"
              label={t("onboarding.programme.fieldLabel")}
              error={errorKey && t(errorKey)}
              placeholder={t("onboarding.programme.placeholder")}
              value={name}
              onChangeText={(next) => {
                setName(next)
                if (errorKey !== null) setErrorKey(null)
              }}
              autoCapitalize="sentences"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={submit}
            />
          </KeyboardSafeActionLayout>
        )}
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  actionRegion: { paddingTop: Spacing.three, paddingBottom: Spacing.four },
})
