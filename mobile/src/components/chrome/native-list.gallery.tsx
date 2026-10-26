import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
  NativeList,
  NativeListAlert,
  NativeListChoiceRow,
  NativeListHeader,
  NativeListRadioDialog,
  NativeListRow,
  type NativeListRowProps,
  NativeListSection,
  NativeListSwitchRow,
} from "@/components/chrome"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"

type Story = GalleryStory<NativeListRowProps>

const CHOICES = ["first", "second"] as const

type Choice = (typeof CHOICES)[number]

function RowsFixture() {
  const { t } = useTranslation()
  const [actions, setActions] = useState(0)
  return (
    <NativeList>
      <NativeListSection
        title={t("gallery.nativeList.section.rows")}
        footer={t("gallery.nativeList.section.rowsFooter")}
        testID="gallery-native-list-rows"
      >
        <NativeListRow
          kind="navigation"
          icon={{ ios: "info.circle", android: "info" }}
          label={t("gallery.nativeList.navigation.label")}
          value={t("gallery.nativeList.navigation.value")}
          badge="3"
          hint={t("gallery.nativeList.navigation.hint")}
          href="/about"
          testID="gallery-native-list-navigation"
        />
        <NativeListRow
          kind="navigation"
          label={t("gallery.nativeList.plain.label")}
          hint={t("gallery.nativeList.navigation.hint")}
          href="/about"
          testID="gallery-native-list-plain"
        />
        <NativeListRow
          kind="action"
          icon={{ ios: "envelope", android: "mail" }}
          label={t("gallery.nativeList.action.label")}
          value={actions > 0 ? String(actions) : undefined}
          onPress={() => setActions((count) => count + 1)}
          testID="gallery-native-list-action"
        />
        <NativeListRow
          kind="value"
          icon={{ ios: "server.rack", android: "dns" }}
          label={t("gallery.nativeList.value.label")}
          value={t("gallery.nativeList.navigation.value")}
          testID="gallery-native-list-value"
        />
        <NativeListRow
          kind="navigation"
          label={t("gallery.nativeList.subtitle.label")}
          subtitle={t("gallery.nativeList.subtitle.subtitle")}
          value={t("gallery.nativeList.navigation.value")}
          hint={t("gallery.nativeList.navigation.hint")}
          href="/about"
          testID="gallery-native-list-subtitle"
        />
      </NativeListSection>
    </NativeList>
  )
}

function DestructiveFixture() {
  const { t } = useTranslation()
  const [actions, setActions] = useState(0)
  return (
    <NativeList>
      <NativeListSection>
        <NativeListRow
          kind="action"
          destructive
          label={t("gallery.nativeList.destructive.label")}
          value={actions > 0 ? String(actions) : undefined}
          onPress={() => setActions((count) => count + 1)}
          testID="gallery-native-list-destructive"
        />
      </NativeListSection>
    </NativeList>
  )
}

function SwitchesFixture() {
  const { t } = useTranslation()
  const [switchOn, setSwitchOn] = useState(true)
  const [switchOff, setSwitchOff] = useState(false)
  return (
    <NativeList>
      <NativeListSection title={t("gallery.nativeList.section.switches")}>
        <NativeListSwitchRow
          icon={{ ios: "person", android: "person" }}
          label={t("gallery.nativeList.switch.on")}
          value={switchOn}
          onValueChange={setSwitchOn}
          testID="gallery-native-list-switch-on"
        />
        <NativeListSwitchRow
          label={t("gallery.nativeList.switch.off")}
          value={switchOff}
          onValueChange={setSwitchOff}
          testID="gallery-native-list-switch-off"
        />
      </NativeListSection>
    </NativeList>
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
    <NativeListSection title={t("gallery.nativeList.section.choices")}>
      {CHOICES.map((value) => (
        <NativeListChoiceRow
          key={value}
          label={t(`gallery.nativeList.choice.${value}`)}
          selected={choice === value}
          selectedAccessibilityLabel={t("gallery.nativeList.choice.selected")}
          onSelect={() => onSelect(value)}
          testID={`gallery-native-list-choice-${value}`}
        />
      ))}
    </NativeListSection>
  )
}

function ChoicesFixture() {
  const [choice, setChoice] = useState<Choice>("first")
  return (
    <NativeList>
      <ChoiceRows choice={choice} onSelect={setChoice} />
    </NativeList>
  )
}

function HeaderAndAlertFixture() {
  const { t } = useTranslation()
  const [retries, setRetries] = useState(0)
  return (
    <NativeList>
      <NativeListAlert
        title={t("gallery.nativeList.error.title")}
        message={t("gallery.nativeList.error.message")}
        testID="gallery-native-list-error"
        messageTestID="gallery-native-list-error-message"
        action={{
          label: t("gallery.nativeList.error.retry"),
          accessibilityLabel: t("gallery.nativeList.error.retryLabel"),
          testID: "gallery-native-list-error-retry",
          onPress: () => setRetries((count) => count + 1),
        }}
      />
      <NativeListHeader
        title={t("app.name")}
        tagline={t("gallery.nativeList.header.tagline")}
        detail={t("gallery.nativeList.section.rowsFooter")}
        caption={`${t("gallery.nativeList.header.caption")} · ${retries}`}
        testID="gallery-native-list-header"
        captionTestID="gallery-native-list-header-caption"
      />
    </NativeList>
  )
}

function RadioDialogFixture() {
  const { t } = useTranslation()
  const [choice, setChoice] = useState<Choice>("first")
  const [dialogOpen, setDialogOpen] = useState(false)
  return (
    <>
      <NativeList>
        <NativeListSection>
          <NativeListRow
            kind="action"
            label={t("gallery.nativeList.action.label")}
            hint={t("gallery.nativeList.action.hint")}
            onPress={() => setDialogOpen(true)}
            testID="gallery-native-list-dialog-open"
          />
        </NativeListSection>
        <ChoiceRows choice={choice} onSelect={setChoice} />
      </NativeList>
      <NativeListRadioDialog
        visible={dialogOpen}
        title={t("gallery.nativeList.dialog.title")}
        cancelLabel={t("gallery.nativeList.dialog.cancel")}
        value={choice}
        options={CHOICES.map((value) => ({
          value,
          label: t(`gallery.nativeList.choice.${value}`),
        }))}
        testID="gallery-native-list-dialog"
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
    <NativeList>
      <NativeListHeader
        title={t("app.name")}
        tagline={t("gallery.nativeList.long.tagline")}
        detail={t("gallery.nativeList.long.footer")}
        caption={t("gallery.nativeList.header.caption")}
        testID="gallery-native-list-long-header"
      />
      <NativeListSection
        title={t("gallery.nativeList.long.section")}
        footer={t("gallery.nativeList.long.footer")}
        testID="gallery-native-list-long"
      >
        <NativeListRow
          kind="navigation"
          icon={{ ios: "calendar", android: "calendar_month" }}
          label={t("gallery.nativeList.long.label")}
          value={t("gallery.nativeList.long.value")}
          badge="99+"
          hint={t("gallery.nativeList.long.hint")}
          href="/about"
          testID="gallery-native-list-long-navigation"
        />
        <NativeListRow
          kind="navigation"
          label={t("gallery.nativeList.long.wordLabel")}
          subtitle={t("gallery.nativeList.long.subtitle")}
          value={t("gallery.nativeList.long.value")}
          hint={t("gallery.nativeList.long.hint")}
          href="/about"
          testID="gallery-native-list-long-word"
        />
        <NativeListRow
          kind="value"
          label={t("gallery.nativeList.long.label")}
          value={t("gallery.nativeList.long.value")}
          testID="gallery-native-list-long-value"
        />
        <NativeListSwitchRow
          label={t("gallery.nativeList.long.label")}
          value={switchOn}
          onValueChange={setSwitchOn}
          testID="gallery-native-list-long-switch"
        />
      </NativeListSection>
    </NativeList>
  )
}

const meta: GalleryMeta<NativeListRowProps> = {
  id: "native-list",
  title: "gallery.nativeList.title",
  component: NativeListRow,
  stories: [
    "Rows",
    "Destructive",
    "Switches",
    "Choices",
    "HeaderAndAlert",
    "RadioDialog",
    "LongStrings",
  ],
}

export default meta

export const Rows: Story = {
  name: "gallery.nativeList.story.rows",
  render: () => <RowsFixture />,
}

export const Destructive: Story = {
  name: "gallery.nativeList.story.destructive",
  render: () => <DestructiveFixture />,
}

export const Switches: Story = {
  name: "gallery.nativeList.story.switches",
  render: () => <SwitchesFixture />,
}

export const Choices: Story = {
  name: "gallery.nativeList.story.choices",
  render: () => <ChoicesFixture />,
}

export const HeaderAndAlert: Story = {
  name: "gallery.nativeList.story.headerAndAlert",
  render: () => <HeaderAndAlertFixture />,
}

export const RadioDialog: Story = {
  name: "gallery.nativeList.story.radioDialog",
  platforms: ["android"],
  render: () => <RadioDialogFixture />,
}

export const LongStrings: Story = {
  name: "gallery.nativeList.story.longStrings",
  render: () => <LongStringsFixture />,
}
