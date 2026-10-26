import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
  Button,
  KeyboardSafeActionLayout,
  PageIntro,
  RootPage,
  TextField,
} from "@/design"
import {
  isImportNameWithinLimit,
  normalizeImportName,
  useImportDraft,
} from "@/features/onboarding/draft"
import { clearSelection } from "@/features/school-selection"

// The name is required (unlike the programme name, which Skip may leave empty):
// it is the only institution signal an unlisted import carries, so an empty one
// produces a calendar support cannot place.
//
// Submitting clears the persisted school selection: the group step still writes
// it, and a stale school id there would attribute this unlisted import to a
// school the student said they could not find.
export default function InstitutionNameScreen() {
  const { t } = useTranslation()
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
    <>
      <Stack.Screen options={{ title: t("onboarding.institution.title") }} />
      <RootPage testID="onboarding-institution-content" lane="readable">
        {() => (
          <KeyboardSafeActionLayout
            contentPlacement="center"
            testID="onboarding-institution-keyboard-layout"
            actions={
              <Button
                variant="filled"
                testID="onboarding-institution-continue"
                label={t("onboarding.institution.continue")}
                accessibilityLabel={t("onboarding.institution.continueLabel")}
                onPress={submit}
              />
            }
          >
            <PageIntro caption={t("onboarding.institution.helper")} />

            <TextField
              testID="onboarding-institution-input"
              label={t("onboarding.institution.fieldLabel")}
              error={errorKey && t(errorKey)}
              placeholder={t("onboarding.institution.placeholder")}
              value={name}
              onChangeText={(next) => {
                setName(next)
                if (errorKey !== null) setErrorKey(null)
              }}
              autoCapitalize="words"
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
