import { type ComponentProps, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { PrimaryAction } from "@/components/primary-action"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import type { GalleryMeta, GalleryStory } from "@/design"
import { Spacing } from "@/theme"

type Story = GalleryStory<ComponentProps<typeof PrimaryAction>>

function PrimaryActionFixture({
  disabled = false,
  busy = false,
  long = false,
}: {
  disabled?: boolean
  busy?: boolean
  long?: boolean
}) {
  const { t } = useTranslation()
  const [count, setCount] = useState(0)
  return (
    <RootPage>
      <View style={styles.stack}>
        <PrimaryAction
          testID="gallery-primary-action"
          label={t(
            long ? "gallery.stress.action" : "gallery.primaryAction.label",
          )}
          onPress={() => setCount((value) => value + 1)}
          disabled={disabled}
          busy={busy}
        />
        {long ? (
          <PrimaryAction
            testID="gallery-primary-action-word"
            label={t("gallery.stress.word")}
            onPress={() => setCount((value) => value + 1)}
          />
        ) : null}
        <ThemedText tone="secondary" testID="gallery-primary-action-count">
          {t("gallery.pressCount", { count })}
        </ThemedText>
      </View>
    </RootPage>
  )
}

const styles = StyleSheet.create({ stack: { gap: Spacing.three } })

const meta: GalleryMeta<ComponentProps<typeof PrimaryAction>> = {
  id: "primary-action",
  title: "gallery.primaryAction.title",
  component: PrimaryAction,
  stories: ["Default", "Disabled", "Busy", "LongStrings"],
}

export default meta

export const Default: Story = {
  name: "gallery.primaryAction.story.default",
  render: () => <PrimaryActionFixture />,
}

export const Disabled: Story = {
  name: "gallery.primaryAction.story.disabled",
  render: () => <PrimaryActionFixture disabled />,
}

export const Busy: Story = {
  name: "gallery.primaryAction.story.busy",
  render: () => <PrimaryActionFixture busy />,
}

export const LongStrings: Story = {
  name: "gallery.primaryAction.story.longStrings",
  render: () => <PrimaryActionFixture long />,
}
