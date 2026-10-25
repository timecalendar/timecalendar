import { Redirect, router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
  NativeSettingsHost,
  NativeSettingsRow,
  NativeSettingsSection,
  NativeTextEntryDialog,
} from "@/components/chrome"
import { isDevVariant } from "@/config/variant"
import {
  EnvironmentSelectorDialog,
  EnvironmentSettingsRow,
  useEnvironmentSelector,
} from "@/features/environment"

// Static declarations keep the selectors discoverable by the Maestro source
// guard while the chrome contract passes them to either native toolkit.
const devImportDialogSelectors = {
  dialog: { testID: "developer-dev-import-dialog" },
  input: { testID: "developer-dev-import-input" },
  message: { testID: "developer-dev-import-message" },
  cancel: { testID: "developer-dev-import-cancel" },
  submit: { testID: "developer-dev-import-submit" },
} as const

const devImportDialogIds = {
  dialog: devImportDialogSelectors.dialog.testID,
  input: devImportDialogSelectors.input.testID,
  message: devImportDialogSelectors.message.testID,
  cancel: devImportDialogSelectors.cancel.testID,
  submit: devImportDialogSelectors.submit.testID,
} as const

export function DeveloperScreen() {
  const { t } = useTranslation()
  const [importOpen, setImportOpen] = useState(false)
  const [token, setToken] = useState("")
  const environmentSelector = useEnvironmentSelector()

  if (environmentSelector.capability === "production") {
    return <Redirect href="/settings" />
  }

  const openImport = () => {
    setToken("")
    setImportOpen(true)
  }

  const submitImport = (currentValue: string) => {
    const value = currentValue.trim()
    if (value.length === 0) return
    setImportOpen(false)
    router.push({ pathname: "/dev-import", params: { token: value } })
  }

  return (
    <>
      <Stack.Screen options={{ title: t("developer.title") }} />
      <NativeSettingsHost>
        <NativeSettingsSection
          title={t("developer.section.backend")}
          testID="developer-section-backend"
        >
          <EnvironmentSettingsRow selector={environmentSelector} />
        </NativeSettingsSection>
        {isDevVariant() ? (
          <NativeSettingsSection
            title={t("developer.section.testData")}
            testID="developer-section-test-data"
          >
            <NativeSettingsRow
              kind="action"
              label={t("developer.devImport.label")}
              hint={t("developer.devImport.hint")}
              icon={{ ios: "square.and.arrow.down", android: "download" }}
              onPress={openImport}
              testID="developer-dev-import"
            />
          </NativeSettingsSection>
        ) : null}
        <NativeSettingsSection
          title={t("developer.section.design")}
          testID="developer-section-design"
        >
          <NativeSettingsRow
            kind="navigation"
            href="/settings-gallery"
            label={t("developer.gallery.label")}
            hint={t("developer.gallery.hint")}
            icon={{ ios: "square.grid.2x2", android: "grid_view" }}
            testID="developer-gallery"
          />
        </NativeSettingsSection>
      </NativeSettingsHost>
      <EnvironmentSelectorDialog selector={environmentSelector} />
      {importOpen ? (
        <NativeTextEntryDialog
          title={t("developer.devImport.dialogTitle")}
          initialValue=""
          label={t("developer.devImport.fieldLabel")}
          placeholder={t("developer.devImport.placeholder")}
          message={null}
          inputKind="code"
          cancelLabel={t("common.cancel")}
          submitLabel={t("developer.devImport.submit")}
          pending={false}
          submitDisabled={token.trim().length === 0}
          ids={devImportDialogIds}
          onChange={setToken}
          onSubmit={submitImport}
          onCancel={() => setImportOpen(false)}
        />
      ) : null}
    </>
  )
}
