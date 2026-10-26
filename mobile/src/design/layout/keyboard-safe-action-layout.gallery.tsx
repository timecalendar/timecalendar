import { type ComponentProps, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import {
  Button,
  KeyboardSafeActionLayout,
  PageIntro,
  RootPage,
  TextField,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing } from "@/theme"

type Story = GalleryStory<ComponentProps<typeof KeyboardSafeActionLayout>>

const LONG_FIELDS = 4

function Field({ label, testID }: { label: string; testID: string }) {
  const [value, setValue] = useState("")
  return (
    <TextField
      testID={testID}
      label={label}
      value={value}
      onChangeText={setValue}
    />
  )
}

function Submit({ label }: { label: string }) {
  return (
    <Button
      variant="filled"
      testID="gallery-keyboard-layout-submit"
      label={label}
      onPress={() => {}}
    />
  )
}

function FormFixture({ fillsViewport = false }: { fillsViewport?: boolean }) {
  const { t } = useTranslation()
  return (
    <RootPage scrollsUnderHeader={!fillsViewport}>
      {() => (
        <KeyboardSafeActionLayout
          scrollsUnderHeader={!fillsViewport}
          testID="gallery-keyboard-layout"
          contentContainerStyle={
            fillsViewport ? [styles.content, styles.centered] : styles.content
          }
          actionContainerStyle={styles.actions}
          actions={
            <Submit label={t("gallery.keyboardSafeActionLayout.submit")} />
          }
        >
          <PageIntro caption={t("gallery.keyboardSafeActionLayout.caption")} />
          <Field
            label={t("gallery.keyboardSafeActionLayout.fieldLabel")}
            testID="gallery-keyboard-layout-input"
          />
        </KeyboardSafeActionLayout>
      )}
    </RootPage>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  return (
    <RootPage scrollsUnderHeader>
      {() => (
        <KeyboardSafeActionLayout
          testID="gallery-keyboard-layout"
          contentContainerStyle={styles.content}
          actionContainerStyle={styles.actions}
          actions={<Submit label={t("gallery.stress.action")} />}
        >
          <PageIntro
            title={t("gallery.stress.title")}
            caption={t("gallery.stress.body")}
          />
          {Array.from({ length: LONG_FIELDS }, (_, index) => (
            <Field
              key={index}
              label={t("gallery.keyboardSafeActionLayout.longFieldLabel", {
                number: index + 1,
              })}
              testID={`gallery-keyboard-layout-input-${index + 1}`}
            />
          ))}
          <ThemedText>{t("gallery.stress.body")}</ThemedText>
        </KeyboardSafeActionLayout>
      )}
    </RootPage>
  )
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three },
  centered: { flexGrow: 1, justifyContent: "center" },
  actions: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
})

const meta: GalleryMeta<ComponentProps<typeof KeyboardSafeActionLayout>> = {
  id: "keyboard-safe-action-layout",
  title: "gallery.keyboardSafeActionLayout.title",
  component: KeyboardSafeActionLayout,
  stories: ["Default", "FillsViewport", "LongStrings"],
}

export default meta

export const Default: Story = {
  name: "gallery.keyboardSafeActionLayout.story.default",
  render: () => <FormFixture />,
}

export const FillsViewport: Story = {
  name: "gallery.keyboardSafeActionLayout.story.fillsViewport",
  render: () => <FormFixture fillsViewport />,
}

export const LongStrings: Story = {
  name: "gallery.keyboardSafeActionLayout.story.longStrings",
  render: () => <LongStringsFixture />,
}
