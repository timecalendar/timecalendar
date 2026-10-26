import { type ComponentProps, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import {
  ErrorNotice,
  FieldError as FieldErrorMessage,
  headerScrollProps,
  RootPage,
  TextField,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing } from "@/theme"

type Story = GalleryStory<ComponentProps<typeof ErrorNotice>>

function usePressCount() {
  const [count, setCount] = useState(0)
  return [count, () => setCount((value) => value + 1)] as const
}

function PressCount({ count }: { count: number }) {
  const { t } = useTranslation()
  return (
    <ThemedText tone="secondary" testID="gallery-error-surfaces-count">
      {t("gallery.pressCount", { count })}
    </ThemedText>
  )
}

function NoticeFixture({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const [count, press] = usePressCount()
  return (
    <RootPage>
      <View style={styles.stack}>
        <ErrorNotice
          {...(compact
            ? {}
            : { title: t("gallery.errorSurfaces.noticeTitle") })}
          message={t("gallery.errorSurfaces.noticeMessage")}
          compact={compact}
          action={{
            label: t(
              compact
                ? "gallery.errorSurfaces.report"
                : "gallery.errorSurfaces.retry",
            ),
            onPress: press,
            accessibilityRole: compact ? "link" : "button",
            testID: "gallery-error-surfaces-notice-action",
          }}
          testID="gallery-error-surfaces-notice"
        />
        <PressCount count={count} />
      </View>
    </RootPage>
  )
}

function FieldErrorFixture() {
  const { t } = useTranslation()
  const [value, setValue] = useState("")
  return (
    <RootPage>
      <TextField
        testID="gallery-error-surfaces-input"
        label={t("gallery.errorSurfaces.fieldLabel")}
        error={t("gallery.errorSurfaces.fieldMessage")}
        value={value}
        onChangeText={setValue}
      />
    </RootPage>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  const [count, press] = usePressCount()
  return (
    <RootPage scrollsUnderHeader>
      {({ laneStyle }) => (
        <ScrollView
          {...headerScrollProps(true)}
          contentContainerStyle={[laneStyle, styles.scroll]}
        >
          <ErrorNotice
            title={t("gallery.stress.title")}
            message={`${t("gallery.stress.body")} ${t("gallery.stress.word")}`}
            action={{ label: t("gallery.stress.action"), onPress: press }}
          />
          <FieldErrorMessage message={t("gallery.stress.body")} />
          <PressCount count={count} />
        </ScrollView>
      )}
    </RootPage>
  )
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.three },
  scroll: { paddingTop: Spacing.four, gap: Spacing.four },
})

const meta: GalleryMeta<ComponentProps<typeof ErrorNotice>> = {
  id: "error-surfaces",
  title: "gallery.errorSurfaces.title",
  component: ErrorNotice,
  stories: ["Notice", "NoticeCompact", "FieldError", "LongStrings"],
}

export default meta

export const Notice: Story = {
  name: "gallery.errorSurfaces.story.notice",
  render: () => <NoticeFixture />,
}

export const NoticeCompact: Story = {
  name: "gallery.errorSurfaces.story.noticeCompact",
  render: () => <NoticeFixture compact />,
}

export const FieldError: Story = {
  name: "gallery.errorSurfaces.story.fieldError",
  render: () => <FieldErrorFixture />,
}

export const LongStrings: Story = {
  name: "gallery.errorSurfaces.story.longStrings",
  render: () => <LongStringsFixture />,
}
