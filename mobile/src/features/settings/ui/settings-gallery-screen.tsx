import { Redirect, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import {
  NativeSettingsAlert,
  NativeSettingsChoiceRow,
  NativeSettingsFloatingAction,
  NativeSettingsHeader,
  NativeSettingsHost,
  NativeSettingsRadioDialog,
  NativeSettingsRow,
  NativeSettingsSection,
  NativeSettingsSwitchRow,
} from "@/components/chrome"
import { getBackendEnvironmentCapability } from "@/features/environment"

type GalleryChoice = "first" | "second"

const CHOICES = ["first", "second"] as const

export function SettingsGalleryScreen() {
  const { t } = useTranslation()
  const [switchOn, setSwitchOn] = useState(true)
  const [switchOff, setSwitchOff] = useState(false)
  const [choice, setChoice] = useState<GalleryChoice>("first")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [retries, setRetries] = useState(0)
  const [actions, setActions] = useState(0)

  if (getBackendEnvironmentCapability() === "production") {
    return <Redirect href="/settings" />
  }

  return (
    <>
      <Stack.Screen options={{ title: t("settingsGallery.title") }} />
      <View style={styles.fill}>
        <NativeSettingsHost reservesFloatingAction>
          <NativeSettingsAlert
            title={t("settingsGallery.error.title")}
            message={t("settingsGallery.error.message")}
            testID="settings-gallery-error"
            messageTestID="settings-gallery-error-message"
            action={{
              label: t("settingsGallery.error.retry"),
              accessibilityLabel: t("settingsGallery.error.retryLabel"),
              testID: "settings-gallery-error-retry",
              onPress: () => setRetries((count) => count + 1),
            }}
          />
          <NativeSettingsHeader
            title={t("app.name")}
            tagline={t("settingsGallery.header.tagline")}
            detail={t("settingsGallery.section.rowsFooter")}
            caption={`${t("settingsGallery.header.caption")} · ${retries}`}
            testID="settings-gallery-header"
            captionTestID="settings-gallery-header-caption"
          />
          <NativeSettingsSection
            title={t("settingsGallery.section.rows")}
            footer={t("settingsGallery.section.rowsFooter")}
            testID="settings-gallery-rows"
          >
            <NativeSettingsRow
              kind="navigation"
              icon={{ ios: "info.circle", android: "info" }}
              label={t("settingsGallery.navigation.label")}
              value={t("settingsGallery.navigation.value")}
              badge="3"
              hint={t("settingsGallery.navigation.hint")}
              href="/about"
              testID="settings-gallery-navigation"
            />
            <NativeSettingsRow
              kind="navigation"
              label={t("settingsGallery.plain.label")}
              hint={t("settingsGallery.navigation.hint")}
              href="/about"
              testID="settings-gallery-plain"
            />
            <NativeSettingsRow
              kind="action"
              icon={{ ios: "envelope", android: "mail" }}
              label={t("settingsGallery.action.label")}
              hint={t("settingsGallery.action.hint")}
              onPress={() => setDialogOpen(true)}
              testID="settings-gallery-action"
            />
            <NativeSettingsRow
              kind="value"
              icon={{ ios: "server.rack", android: "dns" }}
              label={t("settingsGallery.value.label")}
              value={t("settingsGallery.navigation.value")}
              testID="settings-gallery-value"
            />
            <NativeSettingsRow
              kind="navigation"
              label={t("settingsGallery.subtitle.label")}
              subtitle={t("settingsGallery.subtitle.subtitle")}
              value={t("settingsGallery.navigation.value")}
              hint={t("settingsGallery.navigation.hint")}
              href="/about"
              testID="settings-gallery-subtitle"
            />
          </NativeSettingsSection>
          <NativeSettingsSection>
            <NativeSettingsRow
              kind="action"
              destructive
              label={t("settingsGallery.destructive.label")}
              value={actions > 0 ? String(actions) : undefined}
              onPress={() => setActions((count) => count + 1)}
              testID="settings-gallery-destructive"
            />
          </NativeSettingsSection>
          <NativeSettingsSection title={t("settingsGallery.section.switches")}>
            <NativeSettingsSwitchRow
              icon={{ ios: "person", android: "person" }}
              label={t("settingsGallery.switch.on")}
              value={switchOn}
              onValueChange={setSwitchOn}
              testID="settings-gallery-switch-on"
            />
            <NativeSettingsSwitchRow
              label={t("settingsGallery.switch.off")}
              value={switchOff}
              onValueChange={setSwitchOff}
              testID="settings-gallery-switch-off"
            />
          </NativeSettingsSection>
          <NativeSettingsSection title={t("settingsGallery.section.choices")}>
            {CHOICES.map((value) => (
              <NativeSettingsChoiceRow
                key={value}
                label={t(`settingsGallery.choice.${value}`)}
                selected={choice === value}
                selectedAccessibilityLabel={t(
                  "settingsGallery.choice.selected",
                )}
                onSelect={() => setChoice(value)}
                testID={`settings-gallery-choice-${value}`}
              />
            ))}
          </NativeSettingsSection>
        </NativeSettingsHost>
        <NativeSettingsFloatingAction
          label={t("settingsGallery.fab.label")}
          icon={{ ios: "plus", android: "add" }}
          testID="settings-gallery-fab"
          onPress={() => setActions((count) => count + 1)}
        />
      </View>
      <NativeSettingsRadioDialog
        visible={dialogOpen}
        title={t("settingsGallery.dialog.title")}
        cancelLabel={t("settingsGallery.dialog.cancel")}
        value={choice}
        options={CHOICES.map((value) => ({
          value,
          label: t(`settingsGallery.choice.${value}`),
        }))}
        testID="settings-gallery-dialog"
        onDismiss={() => setDialogOpen(false)}
        onSelect={(value: GalleryChoice) => {
          setChoice(value)
          setDialogOpen(false)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({ fill: { flex: 1 } })
