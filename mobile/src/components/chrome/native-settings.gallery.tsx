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
  type NativeSettingsRowProps,
  NativeSettingsSection,
  NativeSettingsSwitchRow,
} from "@/components/chrome"
import type { GalleryMeta, GalleryStory } from "@/design"

type Story = GalleryStory<NativeSettingsRowProps>

const CHOICES = ["first", "second"] as const

type Choice = (typeof CHOICES)[number]

function RowsFixture() {
  const { t } = useTranslation()
  const [actions, setActions] = useState(0)
  return (
    <NativeSettingsHost>
      <NativeSettingsSection
        title={t("gallery.nativeSettings.section.rows")}
        footer={t("gallery.nativeSettings.section.rowsFooter")}
        testID="gallery-native-settings-rows"
      >
        <NativeSettingsRow
          kind="navigation"
          icon={{ ios: "info.circle", android: "info" }}
          label={t("gallery.nativeSettings.navigation.label")}
          value={t("gallery.nativeSettings.navigation.value")}
          badge="3"
          hint={t("gallery.nativeSettings.navigation.hint")}
          href="/about"
          testID="gallery-native-settings-navigation"
        />
        <NativeSettingsRow
          kind="navigation"
          label={t("gallery.nativeSettings.plain.label")}
          hint={t("gallery.nativeSettings.navigation.hint")}
          href="/about"
          testID="gallery-native-settings-plain"
        />
        <NativeSettingsRow
          kind="action"
          icon={{ ios: "envelope", android: "mail" }}
          label={t("gallery.nativeSettings.action.label")}
          value={actions > 0 ? String(actions) : undefined}
          onPress={() => setActions((count) => count + 1)}
          testID="gallery-native-settings-action"
        />
        <NativeSettingsRow
          kind="value"
          icon={{ ios: "server.rack", android: "dns" }}
          label={t("gallery.nativeSettings.value.label")}
          value={t("gallery.nativeSettings.navigation.value")}
          testID="gallery-native-settings-value"
        />
        <NativeSettingsRow
          kind="navigation"
          label={t("gallery.nativeSettings.subtitle.label")}
          subtitle={t("gallery.nativeSettings.subtitle.subtitle")}
          value={t("gallery.nativeSettings.navigation.value")}
          hint={t("gallery.nativeSettings.navigation.hint")}
          href="/about"
          testID="gallery-native-settings-subtitle"
        />
      </NativeSettingsSection>
    </NativeSettingsHost>
  )
}

function DestructiveFixture() {
  const { t } = useTranslation()
  const [actions, setActions] = useState(0)
  return (
    <NativeSettingsHost>
      <NativeSettingsSection>
        <NativeSettingsRow
          kind="action"
          destructive
          label={t("gallery.nativeSettings.destructive.label")}
          value={actions > 0 ? String(actions) : undefined}
          onPress={() => setActions((count) => count + 1)}
          testID="gallery-native-settings-destructive"
        />
      </NativeSettingsSection>
    </NativeSettingsHost>
  )
}

function SwitchesFixture() {
  const { t } = useTranslation()
  const [switchOn, setSwitchOn] = useState(true)
  const [switchOff, setSwitchOff] = useState(false)
  return (
    <NativeSettingsHost>
      <NativeSettingsSection
        title={t("gallery.nativeSettings.section.switches")}
      >
        <NativeSettingsSwitchRow
          icon={{ ios: "person", android: "person" }}
          label={t("gallery.nativeSettings.switch.on")}
          value={switchOn}
          onValueChange={setSwitchOn}
          testID="gallery-native-settings-switch-on"
        />
        <NativeSettingsSwitchRow
          label={t("gallery.nativeSettings.switch.off")}
          value={switchOff}
          onValueChange={setSwitchOff}
          testID="gallery-native-settings-switch-off"
        />
      </NativeSettingsSection>
    </NativeSettingsHost>
  )
}

function ChoiceRows({
  choice,
  onSelect,
}: {
  choice: Choice
  onSelect: (choice: Choice) => void
}) {
  const { t } = useTranslation()
  return (
    <NativeSettingsSection title={t("gallery.nativeSettings.section.choices")}>
      {CHOICES.map((value) => (
        <NativeSettingsChoiceRow
          key={value}
          label={t(`gallery.nativeSettings.choice.${value}`)}
          selected={choice === value}
          selectedAccessibilityLabel={t(
            "gallery.nativeSettings.choice.selected",
          )}
          onSelect={() => onSelect(value)}
          testID={`gallery-native-settings-choice-${value}`}
        />
      ))}
    </NativeSettingsSection>
  )
}

function ChoicesFixture() {
  const [choice, setChoice] = useState<Choice>("first")
  return (
    <NativeSettingsHost>
      <ChoiceRows choice={choice} onSelect={setChoice} />
    </NativeSettingsHost>
  )
}

function HeaderAndAlertFixture() {
  const { t } = useTranslation()
  const [retries, setRetries] = useState(0)
  return (
    <NativeSettingsHost>
      <NativeSettingsAlert
        title={t("gallery.nativeSettings.error.title")}
        message={t("gallery.nativeSettings.error.message")}
        testID="gallery-native-settings-error"
        messageTestID="gallery-native-settings-error-message"
        action={{
          label: t("gallery.nativeSettings.error.retry"),
          accessibilityLabel: t("gallery.nativeSettings.error.retryLabel"),
          testID: "gallery-native-settings-error-retry",
          onPress: () => setRetries((count) => count + 1),
        }}
      />
      <NativeSettingsHeader
        title={t("app.name")}
        tagline={t("gallery.nativeSettings.header.tagline")}
        detail={t("gallery.nativeSettings.section.rowsFooter")}
        caption={`${t("gallery.nativeSettings.header.caption")} · ${retries}`}
        testID="gallery-native-settings-header"
        captionTestID="gallery-native-settings-header-caption"
      />
    </NativeSettingsHost>
  )
}

function FloatingActionFixture() {
  const { t } = useTranslation()
  const [actions, setActions] = useState(0)
  return (
    <View style={styles.fill}>
      <NativeSettingsHost reservesFloatingAction>
        <NativeSettingsSection>
          <NativeSettingsRow
            kind="value"
            label={t("gallery.nativeSettings.fab.label")}
            value={String(actions)}
            testID="gallery-native-settings-fab-count"
          />
        </NativeSettingsSection>
      </NativeSettingsHost>
      <NativeSettingsFloatingAction
        label={t("gallery.nativeSettings.fab.label")}
        icon={{ ios: "plus", android: "add" }}
        testID="gallery-native-settings-fab"
        onPress={() => setActions((count) => count + 1)}
      />
    </View>
  )
}

function RadioDialogFixture() {
  const { t } = useTranslation()
  const [choice, setChoice] = useState<Choice>("first")
  const [dialogOpen, setDialogOpen] = useState(false)
  return (
    <>
      <NativeSettingsHost>
        <NativeSettingsSection>
          <NativeSettingsRow
            kind="action"
            label={t("gallery.nativeSettings.action.label")}
            hint={t("gallery.nativeSettings.action.hint")}
            onPress={() => setDialogOpen(true)}
            testID="gallery-native-settings-dialog-open"
          />
        </NativeSettingsSection>
        <ChoiceRows choice={choice} onSelect={setChoice} />
      </NativeSettingsHost>
      <NativeSettingsRadioDialog
        visible={dialogOpen}
        title={t("gallery.nativeSettings.dialog.title")}
        cancelLabel={t("gallery.nativeSettings.dialog.cancel")}
        value={choice}
        options={CHOICES.map((value) => ({
          value,
          label: t(`gallery.nativeSettings.choice.${value}`),
        }))}
        testID="gallery-native-settings-dialog"
        onDismiss={() => setDialogOpen(false)}
        onSelect={(value: Choice) => {
          setChoice(value)
          setDialogOpen(false)
        }}
      />
    </>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  const [switchOn, setSwitchOn] = useState(true)
  return (
    <NativeSettingsHost>
      <NativeSettingsHeader
        title={t("app.name")}
        tagline={t("gallery.nativeSettings.long.tagline")}
        detail={t("gallery.nativeSettings.long.footer")}
        caption={t("gallery.nativeSettings.header.caption")}
        testID="gallery-native-settings-long-header"
      />
      <NativeSettingsSection
        title={t("gallery.nativeSettings.long.section")}
        footer={t("gallery.nativeSettings.long.footer")}
        testID="gallery-native-settings-long"
      >
        <NativeSettingsRow
          kind="navigation"
          icon={{ ios: "calendar", android: "calendar_month" }}
          label={t("gallery.nativeSettings.long.label")}
          value={t("gallery.nativeSettings.long.value")}
          badge="99+"
          hint={t("gallery.nativeSettings.long.hint")}
          href="/about"
          testID="gallery-native-settings-long-navigation"
        />
        <NativeSettingsRow
          kind="navigation"
          label={t("gallery.nativeSettings.long.wordLabel")}
          subtitle={t("gallery.nativeSettings.long.subtitle")}
          value={t("gallery.nativeSettings.long.value")}
          hint={t("gallery.nativeSettings.long.hint")}
          href="/about"
          testID="gallery-native-settings-long-word"
        />
        <NativeSettingsRow
          kind="value"
          label={t("gallery.nativeSettings.long.label")}
          value={t("gallery.nativeSettings.long.value")}
          testID="gallery-native-settings-long-value"
        />
        <NativeSettingsSwitchRow
          label={t("gallery.nativeSettings.long.label")}
          value={switchOn}
          onValueChange={setSwitchOn}
          testID="gallery-native-settings-long-switch"
        />
      </NativeSettingsSection>
    </NativeSettingsHost>
  )
}

const meta: GalleryMeta<NativeSettingsRowProps> = {
  id: "native-settings",
  title: "gallery.nativeSettings.title",
  component: NativeSettingsRow,
}

export default meta

export const Rows: Story = {
  name: "gallery.nativeSettings.story.rows",
  render: () => <RowsFixture />,
}

export const Destructive: Story = {
  name: "gallery.nativeSettings.story.destructive",
  render: () => <DestructiveFixture />,
}

export const Switches: Story = {
  name: "gallery.nativeSettings.story.switches",
  render: () => <SwitchesFixture />,
}

export const Choices: Story = {
  name: "gallery.nativeSettings.story.choices",
  render: () => <ChoicesFixture />,
}

export const HeaderAndAlert: Story = {
  name: "gallery.nativeSettings.story.headerAndAlert",
  render: () => <HeaderAndAlertFixture />,
}

export const FloatingAction: Story = {
  name: "gallery.nativeSettings.story.floatingAction",
  render: () => <FloatingActionFixture />,
}

export const RadioDialog: Story = {
  name: "gallery.nativeSettings.story.radioDialog",
  render: () => <RadioDialogFixture />,
}

export const LongStrings: Story = {
  name: "gallery.nativeSettings.story.longStrings",
  render: () => <LongStringsFixture />,
}

const styles = StyleSheet.create({ fill: { flex: 1 } })
