import { type ReactNode, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet } from "react-native"

import {
  Button,
  headerScrollProps,
  RootPage,
  TextField,
  type TextFieldProps,
  type TextFieldRef,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing, useIsAccessibilityTextSize } from "@/theme"

type Story = GalleryStory<TextFieldProps>

type FieldFixtureProps = Omit<TextFieldProps, "value" | "onChangeText">

function StatefulField(props: FieldFixtureProps) {
  const [value, setValue] = useState("")
  return <TextField {...props} value={value} onChangeText={setValue} />
}

function Page({ children }: { children: ReactNode }) {
  return (
    <RootPage scrollsUnderHeader>
      {({ laneStyle }) => (
        <ScrollView
          {...headerScrollProps(true)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[laneStyle, styles.scroll]}
        >
          {children}
        </ScrollView>
      )}
    </RootPage>
  )
}

function DefaultFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      <StatefulField
        testID="gallery-text-field-input"
        label={t("gallery.textField.label")}
        placeholder={t("gallery.textField.placeholder")}
      />
    </Page>
  )
}

function HelperFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      <StatefulField
        testID="gallery-text-field-input"
        label={t("gallery.textField.label")}
        helper={t("gallery.textField.helper")}
      />
    </Page>
  )
}

function ErrorFixture() {
  const { t } = useTranslation()
  const [showError, setShowError] = useState(true)
  return (
    <Page>
      <StatefulField
        testID="gallery-text-field-input"
        label={t("gallery.textField.label")}
        helper={t("gallery.textField.helper")}
        error={showError ? t("gallery.textField.error") : null}
      />
      <Button
        variant="tonal"
        testID="gallery-text-field-toggle-error"
        label={t("gallery.textField.toggleError")}
        onPress={() => setShowError((shown) => !shown)}
      />
    </Page>
  )
}

function DisabledFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      <TextField
        testID="gallery-text-field-input"
        label={t("gallery.textField.label")}
        helper={t("gallery.textField.helper")}
        value={t("gallery.textField.placeholder")}
        disabled
      />
    </Page>
  )
}

function MultilineFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      <StatefulField
        testID="gallery-text-field-input"
        label={t("gallery.textField.messageLabel")}
        multiline
      />
    </Page>
  )
}

function KeyboardFixture() {
  const { t } = useTranslation()
  const message = useRef<TextFieldRef>(null)
  return (
    <Page>
      <StatefulField
        testID="gallery-text-field-email"
        label={t("gallery.textField.emailLabel")}
        keyboardType="email-address"
        inputMode="email"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => message.current?.focus()}
      />
      <StatefulField
        ref={message}
        testID="gallery-text-field-message"
        label={t("gallery.textField.messageLabel")}
        multiline
      />
    </Page>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  const accessibilitySize = useIsAccessibilityTextSize()
  return (
    <Page>
      <ThemedText tone="secondary" testID="gallery-text-field-text-size">
        {t(
          accessibilitySize
            ? "gallery.textField.textSize.accessibility"
            : "gallery.textField.textSize.standard",
        )}
      </ThemedText>
      <StatefulField
        testID="gallery-text-field-input"
        label={t("gallery.stress.title")}
        placeholder={t("gallery.stress.word")}
        helper={t("gallery.stress.body")}
        error={t("gallery.stress.action")}
      />
      <StatefulField
        testID="gallery-text-field-multiline"
        label={t("gallery.stress.title")}
        helper={t("gallery.stress.body")}
        multiline
      />
    </Page>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingTop: Spacing.four, gap: Spacing.four },
})

const meta: GalleryMeta<TextFieldProps> = {
  id: "text-field",
  title: "gallery.textField.title",
  component: TextField,
  stories: [
    "Default",
    "Helper",
    "Error",
    "Disabled",
    "Multiline",
    "Keyboard",
    "LongStrings",
  ],
}

export default meta

export const Default: Story = {
  name: "gallery.textField.story.default",
  render: () => <DefaultFixture />,
}

export const Helper: Story = {
  name: "gallery.textField.story.helper",
  render: () => <HelperFixture />,
}

export const Error: Story = {
  name: "gallery.textField.story.error",
  render: () => <ErrorFixture />,
}

export const Disabled: Story = {
  name: "gallery.textField.story.disabled",
  render: () => <DisabledFixture />,
}

export const Multiline: Story = {
  name: "gallery.textField.story.multiline",
  render: () => <MultilineFixture />,
}

export const Keyboard: Story = {
  name: "gallery.textField.story.keyboard",
  render: () => <KeyboardFixture />,
}

export const LongStrings: Story = {
  name: "gallery.textField.story.longStrings",
  render: () => <LongStringsFixture />,
}
