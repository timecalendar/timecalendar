import { type ComponentProps, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, TextInput, View } from "react-native"

import {
  ErrorNotice,
  ErrorState,
  FieldError as FieldErrorMessage,
} from "@/components/error-surfaces"
import { headerScrollProps } from "@/components/header-scroll-props"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import type { GalleryMeta, GalleryStory } from "@/design"
import { Radii, Spacing, useTheme } from "@/theme"

type Story = GalleryStory<ComponentProps<typeof ErrorState>>

const FIELD_ERROR_ID = "gallery-error-surfaces-field-error"

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

function StateFixture({ busy = false }: { busy?: boolean }) {
  const { t } = useTranslation()
  const [count, press] = usePressCount()
  return (
    <RootPage>
      <ErrorState
        title={t("gallery.errorSurfaces.stateTitle")}
        message={t("gallery.errorSurfaces.stateMessage")}
        primaryAction={{
          label: t("gallery.errorSurfaces.retry"),
          onPress: press,
          busy,
          testID: "gallery-error-surfaces-primary",
        }}
        secondaryAction={{
          label: t("gallery.errorSurfaces.report"),
          onPress: press,
          disabled: busy,
          testID: "gallery-error-surfaces-secondary",
        }}
        testID="gallery-error-surfaces-state"
      />
      <PressCount count={count} />
    </RootPage>
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
            role: compact ? "link" : "button",
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
  const theme = useTheme()
  const [value, setValue] = useState("")
  return (
    <RootPage>
      <View style={styles.stack}>
        <ThemedText type="label">
          {t("gallery.errorSurfaces.fieldLabel")}
        </ThemedText>
        <TextInput
          testID="gallery-error-surfaces-input"
          accessibilityLabel={t("gallery.errorSurfaces.fieldLabel")}
          aria-describedby={FIELD_ERROR_ID}
          value={value}
          onChangeText={setValue}
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.error },
          ]}
        />
        <FieldErrorMessage
          nativeID={FIELD_ERROR_ID}
          testID={FIELD_ERROR_ID}
          message={t("gallery.errorSurfaces.fieldMessage")}
        />
      </View>
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
          <ErrorState
            title={t("gallery.stress.title")}
            message={t("gallery.stress.body")}
            primaryAction={{
              label: t("gallery.stress.action"),
              onPress: press,
            }}
            secondaryAction={{
              label: t("gallery.stress.word"),
              onPress: press,
            }}
          />
          <ErrorNotice
            title={t("gallery.stress.title")}
            message={t("gallery.stress.body")}
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
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radii.medium,
    fontSize: 16,
  },
})

const meta: GalleryMeta<ComponentProps<typeof ErrorState>> = {
  id: "error-surfaces",
  title: "gallery.errorSurfaces.title",
  component: ErrorState,
  stories: [
    "State",
    "StateBusy",
    "Notice",
    "NoticeCompact",
    "FieldError",
    "LongStrings",
  ],
}

export default meta

export const State: Story = {
  name: "gallery.errorSurfaces.story.state",
  render: () => <StateFixture />,
}

export const StateBusy: Story = {
  name: "gallery.errorSurfaces.story.stateBusy",
  render: () => <StateFixture busy />,
}

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
